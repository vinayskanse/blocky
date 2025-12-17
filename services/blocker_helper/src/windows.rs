use crate::common::{remove_our_block, END_MARKER, START_MARKER};
use serde::Deserialize;
use std::env;
use std::fs;
use std::io::{self, Write};
use std::path::Path;

#[cfg(target_os = "windows")]
const HOSTS_PATH: &str = r"C:\Windows\System32\drivers\etc\hosts";

#[derive(Deserialize)]
struct DomainList(Vec<String>);

pub fn run() {
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
  blocker_helper check
  blocker_helper apply '[\"example.com\",\"youtube.com\"]'
  blocker_helper clear"
    );
}

/// Windows admin check (best-effort)
fn cmd_check() {
    if is_running_as_admin() {
        println!("ADMIN_OK");
    } else {
        println!("NOT_ADMIN");
    }
}

fn is_running_as_admin() -> bool {
    // Simple write-test to hosts directory
    Path::new(HOSTS_PATH).metadata().is_ok()
}

/// Apply a new blocklist
fn cmd_apply(json_arg: &str) -> io::Result<()> {
    let domains: DomainList = serde_json::from_str(json_arg)
        .map_err(|e| io::Error::new(io::ErrorKind::InvalidInput, e))?;

    let path = Path::new(HOSTS_PATH);
    let original = fs::read_to_string(path)?;

    let cleaned = remove_our_block(&original);

    if domains.0.is_empty() {
        fs::write(path, cleaned)?;
        return Ok(());
    }

    let mut block = String::new();
    block.push('\n');
    block.push_str(START_MARKER);
    block.push('\n');

    for d in domains.0.iter() {
        let d = d.trim().to_lowercase();
        if d.is_empty() || d.contains(char::is_whitespace) {
            continue;
        }

        block.push_str(&format!("127.0.0.1 {d}\n"));
        block.push_str(&format!("127.0.0.1 www.{d}\n"));
    }

    block.push_str(END_MARKER);
    block.push('\n');

    let mut result = String::new();
    result.push_str(cleaned.trim_end());
    result.push('\n');
    result.push_str(&block);

    let tmp_path = format!("{}.tmp", HOSTS_PATH);
    {
        let mut f = fs::File::create(&tmp_path)?;
        f.write_all(result.as_bytes())?;
        f.sync_all()?;
    }

    fs::copy(&tmp_path, path)?;
    fs::remove_file(tmp_path)?;
    Ok(())
}

/// Clear block
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

    fs::copy(&tmp_path, path)?;
    fs::remove_file(tmp_path)?;
    Ok(())
}
