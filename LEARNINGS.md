# The Journey: Building "Blocky"

Hey! This document captures the story of how we built Blocky. It wasn't just about writing code; it was about figuring out *how* to build a system-level tool on macOS that is both secure and user-friendly.

If you're looking to build something similar, hopefully, this saves you some headaches!

![Architecture Diagram](docs/arch.png)

## The Original Idea

The goal seemed simple: **"I want a scheduler that blocks websites."**

We started with basic questions:
- *How do we actually block a site?* -> `/etc/hosts` seemed like the easiest way.
- *How do we automate it?* -> Maybe the app stays open?
- *Do we need root?* -> Definitely, `/etc/hosts` is protected.

## The "Aha!" Moments

### 1. The Sudo Problem
We quickly realized that if we just ran a generic script, the user would have to type their password *every single time* a schedule started or stopped. That's annoying.

**The Solution:** We adopted the **Privileged Helper** pattern.
Instead of giving the main app root power (dangerous!), we built a tiny, separate Rust binary (`blocker_helper`) that does *only* one thing: writes to the hosts file. We installed it with `setuid` root permissions. Now, the main app allows you to configure things, but the helper creates the actual blocks.

### 2. The "Who works when I sleep?" Problem
If you close the App, the blocking should still work, right?
We couldn't rely on the UI being open.

**The Solution:** The **Blocker Scheduler**.
We built a lightweight background service that wakes up every minute. It checks the database, sees what should be blocked *right now*, and tells the helper to do it. It uses macOS `LaunchAgents` to ensure it starts when you log in and stays running.

### 3. The Infinite Loop of Doom
One of our funniest bugs. The Scheduler checks `/etc/hosts` to see if it's tampered with. If it looks different than expected, it re-writes it.
But... our Helper was being "helpful" and adding `www.` aliases and `0.0.0.0` entries.
The Scheduler saw these extra lines, thought "TAMPERING!", and overwrote them.
The Helper wrote them back.
The Scheduler overwrote them again.
*Ad infinitum.*

**The Solution:** **Normalization**. We taught the Scheduler to ignore IP prefixes (`127.0.0.1` vs `0.0.0.0`) and strip `www.` before comparing. Peace was restored.

### 4. The Database Mystery
At one point, the Scheduler insisted there were *no* groups enabled, even though we just added them in the UI.
Turns out, the UI was writing to `~/Library/.../blocker.db` (standard macOS path), but the Scheduler (running from a different context) was looking for `./blocker.db` in its own folder.

**The Solution:** We used the `directories` crate in Rust to ensure everyone, no matter where they run from, looks at the exact same file path.

## Why Rust?

We chose one language for everything.
- **Tauri (Frontend)**: Rust + React. Fast, tiny bundle size.
- **Helper & Scheduler**: Pure Rust. Zero garbage collection pauses, minimal memory footprint (essential for a background process), and memory safety (essential for a root-privileged tool).

## Final Architecture

1. **User** interacts with **Blocky App** -> updates **SQLite DB**.
2. **Scheduler** (Background) wakes up -> reads **DB**.
3. **Scheduler** calculates active domains -> calls **Helper**.
4. **Helper** (Root) writes to **/etc/hosts**.
5. **You** try to visit Facebook -> **Blocked**.

## Contributing

This project taught us a lot about macOS system programming. There's plenty more to do (see `README.md` for ideas). If you want to jump in, the code is structured to be readable.

Happy Coding!
