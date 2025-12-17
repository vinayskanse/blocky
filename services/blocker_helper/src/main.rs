#[cfg(target_os = "macos")]
mod macos;

#[cfg(target_os = "windows")]
mod windows;

mod common;

fn main() {
    #[cfg(target_os = "macos")]
    macos::run();

    #[cfg(target_os = "windows")]
    windows::run();
}
