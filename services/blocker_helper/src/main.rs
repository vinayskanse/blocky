use libc;
use serde::Deserialize;
use std::env;
use std::fs;
use std::io::{self, Write};
use std::path::Path;

const HOSTS_PATH: &str = "/etc/hosts";
const START_MARKER: &str = "# >>> SITE_BLOCKER_START";
const END_MARKER: &str = "# <<< SITE_BLOCKER_END";

#[derive(Deserialize)]
struct DomainList(Vec<String>);

fn main() {
    let args: Vec<String> = env::args().collect();

    if args.len() < 2 {
        print_usage();
        std::process::exit(1);
    }

    match args[1].as_str() {
        "check" => cmd_check(),
        "apply" => {
            if args.len() < 3 {
                eprintln!("Missing JSON domain list argument.");
                std::process::exit(1);
            }
            if let Err(e) = cmd_apply(&args[2]) {
                eprintln!("apply error: {e}");
                std::process::exit(1);
            }
        }
        "clear" => {
            if let Err(e) = cmd_clear() {
                eprintln!("clear error: {e}");
                std::process::exit(1);
            }
        }
        _ => {
            eprintln!("Unknown command: {}", args[1]);
            print_usage();
            std::process::exit(1);
        }
    }
}

fn print_usage() {
    eprintln!(
        "Usage:
  site_blocker_helper check
  site_blocker_helper apply '[\"example.com\",\"youtube.com\"]'
  site_blocker_helper clear"
    );
}

/// Check if the helper is effectively running as root (after setuid).
fn cmd_check() {
    let euid = unsafe { libc::geteuid() };
    if euid == 0 {
        println!("ROOT_OK");
    } else {
        println!("NOT_ROOT (euid = {euid})");
    }
}

/// Apply a new blocklist: replace our marker block in /etc/hosts.
fn cmd_apply(json_arg: &str) -> io::Result<()> {
    // Parse JSON array of strings
    let domains: DomainList = serde_json::from_str(json_arg)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidInput, e))?;

    let path = Path::new(HOSTS_PATH);
    let original = fs::read_to_string(path)?;

    // Remove existing block
    let cleaned = remove_our_block(&original);

    // If list is empty, just write cleaned content (equivalent to clear)
    if domains.0.is_empty() {
        fs::write(path, cleaned)?;
        return Ok(());
    }

    // Build new block
    let mut block = String::new();
    block.push('\n');
    block.push_str(START_MARKER);
    block.push('\n');

    for d in domains.0.iter() {
        let d = d.trim();
        if d.is_empty() {
            continue;
        }
        // Basic sanity: avoid spaces etc. (you can tighten this later)
        if d.contains(char::is_whitespace) {
            continue;
        }

        // 127.0.0.1 domain + www.domain
        block.push_str(&format!("127.0.0.1 {d}\n"));
        block.push_str(&format!("127.0.0.1 www.{d}\n"));
        // Optional 0.0.0.0 variants:
        block.push_str(&format!("0.0.0.0 {d}\n"));
        block.push_str(&format!("0.0.0.0 www.{d}\n"));
    }

    block.push_str(END_MARKER);
    block.push('\n');

    let mut result = String::new();
    result.push_str(cleaned.trim_end());
    result.push('\n');
    result.push_str(&block);

    // Write atomically-ish: write to temp then replace (simple version here)
    let tmp_path = format!("{}.tmp", HOSTS_PATH);
    {
        let mut f = fs::File::create(&tmp_path)?;
        f.write_all(result.as_bytes())?;
        f.sync_all()?;
    }
    fs::rename(tmp_path, path)?;

    Ok(())
}

/// Clear our block from /etc/hosts.
fn cmd_clear() -> io::Result<()> {
    let path = Path::new(HOSTS_PATH);
    let original = fs::read_to_string(path)?;
    let cleaned = remove_our_block(&original);

    let tmp_path = format!("{}.tmp", HOSTS_PATH);
    {
        let mut f = fs::File::create(&tmp_path)?;
        f.write_all(cleaned.as_bytes())?;
        f.sync_all()?;
    }
    fs::rename(tmp_path, path)?;
    Ok(())
}

/// Remove everything between START_MARKER and END_MARKER (inclusive).
fn remove_our_block(content: &str) -> String {
    let start_idx = content.find(START_MARKER);
    let end_idx = content.find(END_MARKER);

    match (start_idx, end_idx) {
        (Some(s), Some(e)) if e >= s => {
            // include the END_MARKER line and the newline after it if present
            let after_end = content[e + END_MARKER.len()..]
                .find('\n')
                .map(|offset| e + END_MARKER.len() + offset + 1)
                .unwrap_or(content.len());

            let before = &content[..s];
            let after = &content[after_end..];

            let mut merged = String::new();
            merged.push_str(before.trim_end());
            merged.push('\n');
            merged.push_str(after.trim_start_matches('\n'));
            merged
        }
        _ => content.to_string(),
    }
}
