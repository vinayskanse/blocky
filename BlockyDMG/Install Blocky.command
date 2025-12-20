#!/bin/bash
#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Installing Blocky…"

APP_NAME="$SCRIPT_DIR/Blocky.app"
HELPER_SRC="$SCRIPT_DIR/blocker_helper"
SCHED_SRC="$SCRIPT_DIR/blocker_scheduler"

HELPER_DST="/usr/local/bin/blocker_helper"
SCHED_DST="/usr/local/bin/blocker_scheduler"

AGENT="$HOME/Library/LaunchAgents/com.blocky.scheduler.plist"
LOG_DIR="$HOME/.blocky"

mkdir -p "$LOG_DIR"

echo "→ Installing app"
cp -R "$APP_NAME" /Applications/

echo "→ Installing helper (requires password)"
sudo cp "$HELPER_SRC" "$HELPER_DST"
sudo chown root:wheel "$HELPER_DST"
sudo chmod 4755 "$HELPER_DST"

echo "→ Installing scheduler"
cp "$SCHED_SRC" "$SCHED_DST"
chmod +x "$SCHED_DST"

echo "→ Installing LaunchAgent"
mkdir -p "$HOME/Library/LaunchAgents"

cat > "$AGENT" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
 "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.blocky.scheduler</string>

  <key>ProgramArguments</key>
  <array>
    <string>$SCHED_DST</string>
  </array>

  <key>RunAtLoad</key>
  <true/>

  <key>KeepAlive</key>
  <true/>

  <key>StandardOutPath</key>
  <string>$LOG_DIR/scheduler.log</string>

  <key>StandardErrorPath</key>
  <string>$LOG_DIR/scheduler.err</string>
</dict>
</plist>
EOF

launchctl load "$AGENT"

echo ""
echo "✅ Blocky installed successfully!"
echo "You can now open Blocky from Applications."
echo ""
read -p "Press Enter to close..."
