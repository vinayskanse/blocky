#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Build Process...${NC}"

# Define paths
ROOT_DIR="$(pwd)"
DIST_DIR="$ROOT_DIR/Blocky_Installer"

# Clean dist
rm -rf "$DIST_DIR"
mkdir -p "$DIST_DIR"

# 1. Build Helper
echo -e "${GREEN}Building Blocker Helper...${NC}"
cd services/blocker_helper
cargo build --release
cp target/release/blocker_helper "$DIST_DIR/"
cd "$ROOT_DIR"

# 2. Build Scheduler
echo -e "${GREEN}Building Blocker Scheduler...${NC}"
cd services/blocker_scheduler
cargo build --release
cp target/release/blocker_scheduler "$DIST_DIR/"
# Copy plist template
cp com.blocker.scheduler.plist "$DIST_DIR/"
# If plist doesn't exist at root, try checking services/blocker_scheduler or creating it?
# In previous steps, user created it in services/blocker_scheduler/com.blocker.scheduler.plist
if [ -f "services/blocker_scheduler/com.blocker.scheduler.plist" ]; then
    cp services/blocker_scheduler/com.blocker.scheduler.plist "$DIST_DIR/"
elif [ -f "com.blocker.scheduler.plist" ]; then
    cp com.blocker.scheduler.plist "$DIST_DIR/"
fi
cd "$ROOT_DIR"

# 3. Build Tauri App
echo -e "${GREEN}Building Tauri Application...${NC}"
# Note: Ensure you have your frontend built if needed? npm run tauri build does both
npm run tauri build

# Copy the .app bundle
# App name should be "blocky.app" now due to tauri.conf.json change
APP_PATH="src-tauri/target/release/bundle/macos/blocky.app"
if [ ! -d "$APP_PATH" ]; then
    # Fallback checking just in case
    APP_PATH="src-tauri/target/release/bundle/macos/control.app"
fi

if [ -d "$APP_PATH" ]; then
    cp -r "$APP_PATH" "$DIST_DIR/Blocky.app"
else
    echo "Error: Could not find built .app bundle at $APP_PATH"
    exit 1
fi

# 4. Copy Scripts
echo -e "${GREEN}Copying Scripts...${NC}"
cp scripts/install.sh "$DIST_DIR/"
cp scripts/uninstall.sh "$DIST_DIR/"

# Make scripts executable
chmod +x "$DIST_DIR/install.sh"
chmod +x "$DIST_DIR/uninstall.sh"

echo -e "${GREEN}Build Complete! Artifacts are in $DIST_DIR/${NC}"
