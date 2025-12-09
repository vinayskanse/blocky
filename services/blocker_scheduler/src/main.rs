use std::process::Command;
use std::{thread, time};

fn main() {
    println!("Scheduler started");

    loop {
        println!("Applying blocking update");
        // Placeholder: final domain list for testing
        let test_domains = vec!["example.com", "example2.com"];

        let json = serde_json::to_string(&test_domains).unwrap();

        let output = Command::new("/usr/local/bin/blocker_helper")
            .arg("apply")
            .arg(json)
            .output()
            .expect("failed to invoke helper");

        if !output.status.success() {
            eprintln!("Helper error: {}", String::from_utf8_lossy(&output.stderr));
        } else {
            println!("Applied blocking update");
        }

        // Sleep 60 seconds
        thread::sleep(time::Duration::from_secs(60));
    }
}
