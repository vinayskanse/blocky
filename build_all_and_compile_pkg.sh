#!/bin/bash
set -e

echo "========================================="
echo " Blocky - Full Build & Final PKG Compile "
echo "========================================="

# Resolve paths
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$ROOT_DIR/installer_build"
PKGROOT="$BUILD_DIR/pkgroot"
SCRIPTS="$BUILD_DIR/scripts"
OUT_PKG="$ROOT_DIR/Blocky.pkg"

APP_DST="$PKGROOT/Applications/Blocky.app"
BIN_DST="$PKGROOT/usr/local/bin"

# --------------------------------------------------
# 0. Clean previous artifacts
# --------------------------------------------------
echo "→ Cleaning previous build"
rm -rf "$PKGROOT"
rm -f "$OUT_PKG"

mkdir -p "$PKGROOT"
mkdir -p "$BIN_DST"

# --------------------------------------------------
# 1. Build Rust privileged services
# --------------------------------------------------
echo "→ Building blocker_helper"
cd "$ROOT_DIR/services/blocker_helper"
cargo build --release

echo "→ Building blocker_scheduler"
cd "$ROOT_DIR/services/blocker_scheduler"
cargo build --release

echo "→ Copying service binaries"
cp target/release/blocker_helper "$BIN_DST/"
cp "$ROOT_DIR/services/blocker_scheduler/target/release/blocker_scheduler" "$BIN_DST/"

chmod 755 "$BIN_DST/blocker_helper"
chmod 755 "$BIN_DST/blocker_scheduler"

# --------------------------------------------------
# 2. Build Tauri app
# --------------------------------------------------
echo "→ Building Blocky desktop app (Tauri)"
cd "$ROOT_DIR"
npm install
npm run build

cd src-tauri
cargo tauri build

TAURI_APP_PATH=$(ls target/release/bundle/macos/*.app | head -n 1)

echo "→ Copying Blocky.app into pkgroot"
mkdir -p "$PKGROOT/Applications"
cp -R "$TAURI_APP_PATH" "$APP_DST"

# --------------------------------------------------
# 3. Validate pkgroot structure
# --------------------------------------------------
echo "→ Validating pkgroot contents"

test -d "$APP_DST" || { echo "❌ Blocky.app missing"; exit 1; }
test -f "$BIN_DST/blocker_helper" || { echo "❌ blocker_helper missing"; exit 1; }
test -f "$BIN_DST/blocker_scheduler" || { echo "❌ blocker_scheduler missing"; exit 1; }

# --------------------------------------------------
# 4. Build final PKG
# --------------------------------------------------
echo "→ Compiling final Blocky.pkg"

pkgbuild \
  --root "$PKGROOT" \
  --scripts "$SCRIPTS" \
  --identifier com.blocky.installer \
  --version 0.1.0 \
  "$OUT_PKG"

# --------------------------------------------------
# 5. Done
# --------------------------------------------------
echo "========================================="
echo "✅ Blocky.pkg successfully built"
echo "→ Output: $OUT_PKG"
echo "========================================="
