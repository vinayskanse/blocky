# Blocky - macOS Website Blocker

Blocky is a powerful, schedule-based website blocker for macOS. Unlike simple timer-based blockers, Blocky allows you to create multiple groups of websites with distinct weekly schedules, ensuring you stay productive without constantly managing your block lists.

![App Screenshot](docs/app_screenshot.png) *(Add screenshot if available)*

## Features

- **Granular Control**: Create multiple blocking groups (e.g., "Social Media", "News", "Work").
- **Flexible Scheduling**: Set specific days and time ranges for each group.
- **Cross-Midnight Support**: Works perfectly for late-night schedules (e.g., 10 PM to 6 AM).
- **Tamper Resistant**: The background scheduler detects changes to the hosts file and re-applies restrictions automatically.
- **Secure**: Uses a privileged helper for system modifications, so the main app never requires root access or stored passwords.
- **Lightweight**: Written in Rust (Tauri frontend + Native background services) for minimal resource usage.

## Architecture

This project is built with security and stability in mind, separating user interaction from system modification.

### 1. Main Application (Tauri + React)
- **Role**: The user interface.
- **Function**: Allows users to manage groups, domains, and schedules.
- **Data**: Writes configuration to a SQLite database (`~/.local/share/com.Blocker.Blocker/blocker.db`).
- **Permissions**: Runs as a standard user. No special privileges.

### 2. Blocker Helper (`blocker_helper`)
- **Role**: The privileged executor.
- **Function**: The only component that touches `/etc/hosts`. modifying it within safe markers.
- **Permissions**: Installed with `setuid` root (`chmod 4755`). This allows it to run with elevated privileges without asking for a password every time.

### 3. Blocker Scheduler (`blocker_scheduler`)
- **Role**: The brain.
- **Function**: Runs every 60 seconds in the background. It reads the database, determines active schedules, and instructs the Helper to apply blocks.
- **Persistence**: Managed by `launchd` via a LaunchAgent, ensuring it starts on login and restarts if crashed.
- **Tamper Detection**: Validates `/etc/hosts` integrity against the expected state and self-heals if tampering is detected.

## Installation

### Prerequisites
- macOS
- Rust & Cargo installed
- Node.js & NPM installed

### Build & Install

We have streamlined the build process into a single script.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/control.git
   cd control
   ```

2. **Build everything:**
   ```bash
   ./scripts/build_all.sh
   ```
   This will compile the Rust binaries, build the frontend, and bundle everything into `Blocky_Installer/`.

3. **Install:**
   ```bash
   cd Blocky_Installer
   ./install.sh
   ```
   *Note: You will be asked for your password once to install the helper tool.*

4. **Run:**
   Open **Blocky** from your Applications folder.

## Uninstalling

To completely remove the application and all background services:

```bash
cd Blocky_Installer
./uninstall.sh
```

## Challenges & Solutions

Building a secure blocker on macOS involves navigating complex permission systems. Here are some hurdles implemented:

- **Sudo Fatigue**: We avoided asking for `sudo` on every schedule trigger by using a **SetUID Helper**. This is standard practice for VPNs and system tools.
- **Database Synchronization**: Ensuring the UI and the Background Scheduler read from the exact same SQLite file was critical. We used `directories-rs` to resolve the platform-standard data path.
- **Tamper Loop**: Initial versions triggered infinite write loops because the Helper rewrote domains (e.g., adding `www` or IP duplicates). We fixed this by normalizing domains before verification.
- **Cross-Midnight Logic**: Scheduling logic isn't just `start < now < end`. We robustly handle `22:00 -> 06:00` ranges by checking if "today is start day" OR "yesterday was start day".

## Future Improvements

This project is open source and can be improved! Feel free to contribute.

- [ ] **Statistics**: Dashboard showing how much time you've saved.
- [ ] **Hardcore Mode**: Prevent uninstalling or changing schedules during active blocks.
- [ ] **Application Blocking**: Block native apps, not just websites.
- [ ] **Network Extension**: Use macOS Network Extensions instead of `/etc/hosts` for more robust blocking (harder to bypass).

## License

MIT License. Feel free to fork and modify!
