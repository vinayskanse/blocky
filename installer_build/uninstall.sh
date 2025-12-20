#!/bin/bash
set -e

GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Uninstalling Blocky App & Services...${NC}"

# 1. Stop and Remove Scheduler
echo "Stopping Scheduler..."
LAUNCH_AGENT="$HOME/Library/LaunchAgents/com.blocker.scheduler.plist"
if [ -f "$LAUNCH_AGENT" ]; then
    launchctl unload "$LAUNCH_AGENT" 2>/dev/null || true
    rm "$LAUNCH_AGENT"
fi

echo "Removing local data..."
# Optional: Keep database? User didn't specify. Assuming full uninstall removes everything but maybe warn?
# Removing ~/.blocker removes binaries and logs.
rm -rf "$HOME/.blocker"

# 2. Remove Helper
echo "Removing Helper (Requires Admin Password)..."
if [ -f "/usr/local/bin/blocker_helper" ]; then
    sudo rm "/usr/local/bin/blocker_helper"
fi

# 3. Remove App
echo "Removing Application..."
rm -rf /Applications/Blocky.app

# 4. Clean Hosts (Optional/Advanced)
# If we uninstall, the /etc/hosts might still have blocks if scheduler didn't clean up.
# We should probably trigger a clean or manually remove markers.
# Triggering cleanup via helper before deleting it is best.
# But helper might already be gone if order is wrong.
# Let's try to call helper clear if it exists
if [ -f "/usr/local/bin/blocker_helper" ]; then
     echo "Clearing hosts rules..."
     sudo /usr/local/bin/blocker_helper clear || true
fi

echo -e "${GREEN}Uninstallation Complete.${NC}"
