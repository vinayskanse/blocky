#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Installing Control App & Services...${NC}"

# 1. Install Control.app
echo "Installing Application..."
if [ -d "Control.app" ]; then
    rm -rf /Applications/Control.app
    cp -r Control.app /Applications/
else
    echo -e "${RED}Control.app not found in current directory!${NC}"
    exit 1
fi

# 2. Install Helper (Needs sudo)
echo "Installing Helper Service (Requires Admin Password)..."
if [ ! -f "blocker_helper" ]; then
    echo -e "${RED}blocker_helper binary not found!${NC}"
    exit 1
fi

sudo cp blocker_helper /usr/local/bin/
sudo chown root:wheel /usr/local/bin/blocker_helper
sudo chmod 4755 /usr/local/bin/blocker_helper # SetUID

# 3. Install Scheduler (User Level)
echo "Installing Scheduler..."
USER_BLOCKER_DIR="$HOME/.blocker"
mkdir -p "$USER_BLOCKER_DIR"

if [ ! -f "blocker_scheduler" ]; then
    echo -e "${RED}blocker_scheduler binary not found!${NC}"
    exit 1
fi

cp blocker_scheduler "$USER_BLOCKER_DIR/"

# Setup LaunchAgent
LAUNCH_AGENT_DIR="$HOME/Library/LaunchAgents"
mkdir -p "$LAUNCH_AGENT_DIR"
PLIST_DEST="$LAUNCH_AGENT_DIR/com.blocker.scheduler.plist"

if [ ! -f "com.blocker.scheduler.plist" ]; then
    echo -e "${RED}com.blocker.scheduler.plist not found!${NC}"
    exit 1
fi

# Copy plist
cp com.blocker.scheduler.plist "$PLIST_DEST"

# Replace binary path in plist if necessary (if we use a fixed path ~/.blocker/blocker_scheduler, 
# XML usually doesn't expand ~. So we must replace it with full path)
# Our plist has /Users/vinay/.blocker/... hardcoded or similar? 
# We should replace it dynamically.

FULL_SCHEDULER_PATH="$USER_BLOCKER_DIR/blocker_scheduler"
LOG_OUT="$USER_BLOCKER_DIR/scheduler.log"
LOG_ERR="$USER_BLOCKER_DIR/scheduler_error.log"

# Use python or sed to replace placeholders? 
# Simplest: Generate plist content here or sed replace known placeholders.
# Assuming plist has /Users/vinay/... we should replace that or generic placeholder.
# Let's assume the plist in source has a placeholder like %HOME% or we sed replace /Users/vinay with $HOME.

# For robustness, let's write the plist content directly here or sed replace the standard path.
# Let's assume the provided plist had /Users/vinay/.blocker...
# We will replace /Users/vinay with $HOME
sed -i '' "s|/Users/[^/]*|$HOME|g" "$PLIST_DEST"

# Unload first if exists
launchctl unload "$PLIST_DEST" 2>/dev/null || true
launchctl load -w "$PLIST_DEST"

echo -e "${GREEN}Installation Complete!${NC}"
echo "You can find 'Control' in your Applications folder."
