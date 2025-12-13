#!/bin/bash
set -e

# Colors
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting Build Process...${NC}"

# Define paths
ROOT_DIR="$(pwd)"
DIST_DIR="$ROOT_DIR/installer_build"

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
cd "$ROOT_DIR"

# 3. Build Tauri App
echo -e "${GREEN}Building Tauri Application...${NC}"
# Note: Ensure you have your frontend built if needed? npm run tauri build does both
npm run tauri build
# Copy the .app bundle
# Path might vary based on target, usually src-tauri/target/release/bundle/macos/Control.app
cp -r src-tauri/target/release/bundle/macos/control.app "$DIST_DIR/Control.app"

# 4. Copy Scripts
echo -e "${GREEN}Copying Scripts...${NC}"
cp scripts/install.sh "$DIST_DIR/"
cp scripts/uninstall.sh "$DIST_DIR/"

# Make scripts executable
chmod +x "$DIST_DIR/install.sh"
chmod +x "$DIST_DIR/uninstall.sh"

echo -e "${GREEN}Build Complete! Artifacts are in $DIST_DIR/${NC}"
