// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod block;
mod commands;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            block::my_custom_command,
            commands::create_group,
            commands::get_all_groups,
            commands::update_group,
            commands::update_domains,
            commands::update_schedule,
            commands::delete_group
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
