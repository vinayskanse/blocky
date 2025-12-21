#!/bin/bash
set -e

echo "======================================="
echo " 🚀 Building Blocky – Final PKG Build "
echo "======================================="

# --------------------------------------------------
# Paths
# --------------------------------------------------
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

PKG_BUILD="$ROOT_DIR/pkg_build"
PKGROOT="$PKG_BUILD/pkgroot"
OUT_PKG="$ROOT_DIR/Blocky.pkg"

BIN_DST="$PKGROOT/usr/local/bin"
APP_DST="$PKGROOT/Applications"

TAURI_APP="$ROOT_DIR/src-tauri/target/release/bundle/macos/Blocky.app"

# --------------------------------------------------
# 0. Clean payload only
# --------------------------------------------------
echo "→ Cleaning pkgroot"
rm -rf "$PKGROOT"
rm -f "$OUT_PKG"

mkdir -p "$BIN_DST"
mkdir -p "$APP_DST"

# --------------------------------------------------
# 1. Build blocker_helper
# --------------------------------------------------
echo "→ Building blocker_helper"
cd "$ROOT_DIR/services/blocker_helper"
cargo build --release
cp target/release/blocker_helper "$BIN_DST/"
chmod 755 "$BIN_DST/blocker_helper"

# --------------------------------------------------
# 2. Build blocker_scheduler
# --------------------------------------------------
echo "→ Building blocker_scheduler"
cd "$ROOT_DIR/services/blocker_scheduler"
cargo build --release
cp target/release/blocker_scheduler "$BIN_DST/"
chmod 755 "$BIN_DST/blocker_scheduler"

# --------------------------------------------------
# 2.5 Setup LaunchAgent
# --------------------------------------------------
echo "→ Setting up LaunchAgent"
LA_DST="$PKGROOT/Library/LaunchAgents"
mkdir -p "$LA_DST"
cp "$PKG_BUILD/com.vinayskanse.blocky.scheduler.plist" "$LA_DST/"
chmod 644 "$LA_DST/com.vinayskanse.blocky.scheduler.plist"

# --------------------------------------------------
# 3. Build Blocky.app (Tauri)
# --------------------------------------------------
echo "→ Building Blocky.app"
cd "$ROOT_DIR"

npm install
npm run build

cd src-tauri
npm run tauri build

# --------------------------------------------------
# 4. Copy Blocky.app CORRECTLY
# --------------------------------------------------
echo "→ Copying Blocky.app into pkgroot"

if [ ! -d "$TAURI_APP" ]; then
  echo "❌ ERROR: Blocky.app not found"
  exit 1
fi

rm -rf "$APP_DST/Blocky.app"
cp -R "$TAURI_APP" "$APP_DST/"

# --------------------------------------------------
# 5. Validate payload
# --------------------------------------------------
echo "→ Validating pkgroot"

test -d "$APP_DST/Blocky.app/Contents" || { echo "❌ Invalid Blocky.app"; exit 1; }
test -f "$BIN_DST/blocker_helper" || { echo "❌ blocker_helper missing"; exit 1; }
test -f "$BIN_DST/blocker_scheduler" || { echo "❌ blocker_scheduler missing"; exit 1; }

# --------------------------------------------------
# 5.5 Generate & Patch Component Plist
# --------------------------------------------------
echo "→ Generating component plist"
COMPONENTS_PLIST="$PKG_BUILD/components.plist"

pkgbuild --root "$PKGROOT" --analyze "$COMPONENTS_PLIST"
plutil -replace 0.BundleIsRelocatable -bool NO "$COMPONENTS_PLIST"

# --------------------------------------------------
# 6. Build PKG (CORRECT)
# --------------------------------------------------
echo "→ Building Blocky.pkg"

pkgbuild \
  --root "$PKGROOT" \
  --install-location / \
  --scripts "$PKG_BUILD/scripts" \
  --component-plist "$COMPONENTS_PLIST" \
  --identifier com.blocky.installer \
  --version 0.1.0 \
  "$OUT_PKG"

echo "======================================="
echo " ✅ Blocky.pkg built successfully"
echo " → $OUT_PKG"
echo "======================================="
