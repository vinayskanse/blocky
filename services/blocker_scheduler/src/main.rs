use blocker_core::{
    establish_connection, get_domains, get_groups, get_last_state, get_schedule, init_db,
    update_last_state,
};

use chrono::{Datelike, Local, Timelike, Weekday};
use std::collections::HashSet;
use std::fs;
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;

fn main() {
    let running = Arc::new(AtomicBool::new(true));
    let r = running.clone();
    println!("[scheduler] Starting...");

    ctrlc::set_handler(move || {
        r.store(false, Ordering::SeqCst);
        println!("[scheduler] Received signal, shutting down...");
    })
    .expect("Ctrl-C handler failed");

    init_db();
    println!("[scheduler] Started.");

    while running.load(Ordering::SeqCst) {
        if let Err(e) = run_cycle() {
            eprintln!("[scheduler] Cycle error: {}", e);
        }

        for _ in 0..60 {
            if !running.load(Ordering::SeqCst) {
                break;
            }
            thread::sleep(Duration::from_secs(1));
        }
    }
}

fn run_cycle() -> Result<(), Box<dyn std::error::Error>> {
    let mut conn = establish_connection();
    let groups = get_groups(&mut conn)?;

    let now = Local::now();
    let current_day = canonical_day(now.weekday());
    let prev_day = canonical_day(yesterday(now.weekday()));
    let now_minutes = now.hour() as i32 * 60 + now.minute() as i32;

    println!(
        "[scheduler] Checking schedules @ {} {} (prev={})",
        now.format("%Y-%m-%d %H:%M"),
        current_day,
        prev_day
    );

    let mut active_domains = HashSet::new();

    for group in groups {
        if !group.enabled {
            println!("[scheduler] Group '{}' disabled → skip.", group.name);
            continue;
        }

        let schedule = match get_schedule(&mut conn, &group.id)? {
            Some(s) => s,
            None => {
                println!("[scheduler] Group '{}' has no schedule → skip.", group.name);
                continue;
            }
        };

        let days: Vec<String> = schedule
            .days
            .split(',')
            .map(|d| d.trim().to_string())
            .collect();

        let start_min = parse_time(&schedule.start)?;
        let end_min = parse_time(&schedule.end)?;

        let is_active = if start_min < end_min {
            days.contains(&current_day) && now_minutes >= start_min && now_minutes < end_min
        } else {
            // Cross-midnight
            let part1 = days.contains(&current_day) && now_minutes >= start_min;
            let part2 = days.contains(&prev_day) && now_minutes < end_min;
            part1 || part2
        };

        println!(
            "[scheduler] Group '{}' active={} (days={:?}, start={}, end={})",
            group.name, is_active, days, schedule.start, schedule.end
        );

        if is_active {
            let domains = get_domains(&mut conn, &group.id)?;
            for d in domains {
                let norm = normalize_domain(&d.domain);
                active_domains.insert(norm);
            }
        }
    }

    let mut final_domains: Vec<String> = active_domains.into_iter().collect();
    final_domains.sort();

    let final_json = serde_json::to_string(&final_domains)?;

    let last_state = get_last_state(&mut conn).ok();
    let last_json = last_state
        .map(|ls| ls.last_domains)
        .unwrap_or_else(|| "[]".to_string());

    if final_json != last_json {
        println!(
            "[scheduler] State changed → new block list: {:?}",
            final_domains
        );

        if final_domains.is_empty() {
            println!("[scheduler] Applying CLEAR");
            call_helper("clear", "")?;
        } else {
            println!(
                "[scheduler] Applying APPLY with {} domains",
                final_domains.len()
            );
            call_helper("apply", &final_json)?;
        }

        update_last_state(&mut conn, &final_json)?;
    } else {
        println!("[scheduler] No DB change → checking for tamper...");
        if !validate_hosts(&final_domains)? {
            println!("[scheduler] Tamper detected! Re-applying block list.");
            if final_domains.is_empty() {
                call_helper("clear", "")?;
            } else {
                call_helper("apply", &final_json)?;
            }
        } else {
            println!("[scheduler] Hosts file OK");
        }
    }

    Ok(())
}

//
// ------------ Utility Functions -------------------
//

fn canonical_day(day: Weekday) -> String {
    match day {
        Weekday::Mon => "Mon".into(),
        Weekday::Tue => "Tue".into(),
        Weekday::Wed => "Wed".into(),
        Weekday::Thu => "Thu".into(),
        Weekday::Fri => "Fri".into(),
        Weekday::Sat => "Sat".into(),
        Weekday::Sun => "Sun".into(),
    }
}

fn yesterday(day: Weekday) -> Weekday {
    match day {
        Weekday::Mon => Weekday::Sun,
        Weekday::Tue => Weekday::Mon,
        Weekday::Wed => Weekday::Tue,
        Weekday::Thu => Weekday::Wed,
        Weekday::Fri => Weekday::Thu,
        Weekday::Sat => Weekday::Fri,
        Weekday::Sun => Weekday::Sat,
    }
}

// Parse "09:00" or "9:00" into minutes
fn parse_time(t: &str) -> Result<i32, Box<dyn std::error::Error>> {
    let parts: Vec<&str> = t.trim().split(':').collect();
    if parts.len() != 2 {
        return Err("Invalid time format".into());
    }

    let h: i32 = parts[0].parse()?;
    let m: i32 = parts[1].parse()?;

    Ok(h * 60 + m)
}

fn normalize_domain(d: &str) -> String {
    d.trim().to_lowercase()
}

fn call_helper(action: &str, payload: &str) -> std::io::Result<()> {
    let out = Command::new("/usr/local/bin/blocker_helper")
        .arg(action)
        .arg(payload)
        .output()?;

    if !out.status.success() {
        eprintln!(
            "[scheduler] Helper error: {}",
            String::from_utf8_lossy(&out.stderr)
        );
        return Err(std::io::Error::new(
            std::io::ErrorKind::Other,
            "Helper failed",
        ));
    }

    Ok(())
}

fn validate_hosts(expected_domains: &[String]) -> std::io::Result<bool> {
    let content = fs::read_to_string("/etc/hosts")?;

    let start_marker = "# >>> BLOCKER";
    let end_marker = "# <<< BLOCKER";

    let start = match content.find(start_marker) {
        Some(i) => i,
        None => return Ok(expected_domains.is_empty()),
    };

    let end = match content.find(end_marker) {
        Some(i) => i,
        None => return Ok(false),
    };

    if start >= end {
        return Ok(false);
    }

    let block = &content[start + start_marker.len()..end];

    let mut found_domains = Vec::new();

    for line in block.lines() {
        let line = line.trim();
        if line.starts_with("127.0.0.1") || line.starts_with("0.0.0.0") {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() >= 2 {
                found_domains.push(normalize_domain(parts[1]));
            }
        }
    }

    found_domains.sort();

    let mut expected_sorted = expected_domains.to_vec();
    expected_sorted.sort();

    if found_domains != expected_sorted {
        println!(
            "[scheduler] Host mismatch: expected {:?}, found {:?}",
            expected_sorted, found_domains
        );
        return Ok(false);
    }

    Ok(true)
}
