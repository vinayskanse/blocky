#!/bin/bash

set -e

echo "Uninstalling Blocky…"

AGENT="$HOME/Library/LaunchAgents/com.blocky.scheduler.plist"
HELPER="/usr/local/bin/blocker_helper"
SCHEDULER="/usr/local/bin/blocker_scheduler"
APP="/Applications/Blocky.app"
DATA="$HOME/Library/Application Support/com.Blocky.Blocky"
LOGS="$HOME/.blocky"

echo "→ Stopping scheduler"
launchctl unload "$AGENT" 2>/dev/null || true

echo "→ Removing LaunchAgent"
rm -f "$AGENT"

echo "→ Clearing blocked websites"
if [ -x "$HELPER" ]; then
  sudo "$HELPER" clear
fi

echo "→ Removing scheduler"
rm -f "$SCHEDULER"

echo "→ Removing helper (requires password)"
sudo rm -f "$HELPER"

echo "→ Removing app"
rm -rf "$APP"

echo "→ Removing data"
rm -rf "$DATA"
rm -rf "$LOGS"

echo ""
echo "✅ Blocky has been completely removed."
echo ""
read -p "Press Enter to close..."
