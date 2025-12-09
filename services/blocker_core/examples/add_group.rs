use blocker_core::{add_domain, add_schedule, create_group, establish_connection, init_db};

fn main() {
    init_db(); // ensure tables exist

    let mut conn = establish_connection();

    let id = "group-123"; // any unique string (uuid recommended later)
    let name = "Social Media";
    let enabled = true;

    match create_group(&mut conn, id, name, enabled) {
        Ok(_) => println!("Group inserted successfully"),
        Err(e) => println!("Insert group failed (might already exist): {:?}", e),
    }

    // Add a domain to the group
    let domain = "facebook.com";
    match add_domain(&mut conn, id, domain) {
        Ok(_) => println!("Domain inserted successfully"),
        Err(e) => println!("Insert domain failed: {:?}", e),
    }

    // Add another domain
    let domain2 = "twitter.com";
    match add_domain(&mut conn, id, domain2) {
        Ok(_) => println!("Domain 2 inserted successfully"),
        Err(e) => println!("Insert domain 2 failed: {:?}", e),
    }

    // Add a schedule
    let days = r#"["Mon", "Tue", "Wed", "Thu", "Fri"]"#;
    let start = "09:00";
    let end = "17:00";
    match add_schedule(&mut conn, id, days, start, end) {
        Ok(_) => println!("Schedule inserted successfully"),
        Err(e) => println!("Insert schedule failed: {:?}", e),
    }
}
