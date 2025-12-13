# Tauri + React + Typescript

This template should help get you started developing with Tauri, React and Typescript in Vite.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)


## Architecture
```txt
┌────────────┐
│   UI App   │
└─────┬──────┘
      │ writes schedules, groups
      ▼
┌────────────┐
│    DB      │  ← source of truth
└─────┬──────┘
      │ reads schedules & groups
      │ 
┌────────────┐
│ Scheduler  │ reads marker block from /etc/hosts (verification only)
└─────┬──────┘
      │ if mismatch or rule change
      ▼
┌────────────┐
│ Priv Helper│  ← root (setuid)
└─────┬──────┘
      │ writes marker block
      ▼
┌────────────┐
│ /etc/hosts │  ← reflection of truth
└────────────┘

```
