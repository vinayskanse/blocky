use blocker_core::{
    add_domain, add_schedule, create_group as core_create_group,
    delete_domains as core_delete_domains, delete_schedule as core_delete_schedule,
    establish_connection, get_domains, get_groups, get_schedule, update_group as core_update_group,
};
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Serialize, Deserialize)]
pub struct GroupResponse {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub domains: Vec<String>,
    pub schedule: Option<ScheduleResponse>,
}

#[derive(Serialize, Deserialize)]
pub struct ScheduleResponse {
    pub days: Vec<String>,
    pub start: String,
    pub end: String,
}

#[command]
pub fn create_group(
    name: String,
    domains: Vec<String>,
    days: Vec<String>,
    start_time: String,
    end_time: String,
) -> Result<(), String> {
    let mut conn = establish_connection();

    let id = uuid::Uuid::new_v4().to_string();

    core_create_group(&mut conn, &id, &name, true).map_err(|e| e.to_string())?;

    for domain in domains {
        add_domain(&mut conn, &id, &domain).map_err(|e| e.to_string())?;
    }

    let days_str = days.join(",");
    add_schedule(&mut conn, &id, &days_str, &start_time, &end_time).map_err(|e| e.to_string())?;

    Ok(())
}

#[command]
pub fn get_all_groups() -> Result<Vec<GroupResponse>, String> {
    let mut conn = establish_connection();
    let groups = get_groups(&mut conn).map_err(|e| e.to_string())?;

    let mut response = Vec::new();

    for group in groups {
        let domains = get_domains(&mut conn, &group.id)
            .map_err(|e| e.to_string())?
            .into_iter()
            .map(|d| d.domain)
            .collect();

        let schedule = get_schedule(&mut conn, &group.id)
            .map_err(|e| e.to_string())?
            .map(|s| ScheduleResponse {
                days: s.days.split(',').map(|s| s.to_string()).collect(),
                start: s.start,
                end: s.end,
            });

        response.push(GroupResponse {
            id: group.id,
            name: group.name,
            enabled: group.enabled,
            domains,
            schedule,
        });
    }

    Ok(response)
}

#[command]
pub fn update_group(id: String, name: String, enabled: bool) -> Result<(), String> {
    let mut conn = establish_connection();
    core_update_group(&mut conn, &id, &name, enabled).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn update_domains(id: String, domains: Vec<String>) -> Result<(), String> {
    let mut conn = establish_connection();
    core_delete_domains(&mut conn, &id).map_err(|e| e.to_string())?;
    for domain in domains {
        add_domain(&mut conn, &id, &domain).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[command]
pub fn update_schedule(
    id: String,
    days: Vec<String>,
    start_time: String,
    end_time: String,
) -> Result<(), String> {
    let mut conn = establish_connection();
    core_delete_schedule(&mut conn, &id).map_err(|e| e.to_string())?;

    let days_str = days.join(",");
    add_schedule(&mut conn, &id, &days_str, &start_time, &end_time).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub fn delete_group(id: String) -> Result<(), String> {
    let mut conn = establish_connection();
    blocker_core::delete_group(&mut conn, &id).map_err(|e| e.to_string())?;
    Ok(())
}
