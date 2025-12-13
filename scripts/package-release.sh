#!/bin/bash
set -e

# Setup directories
ROOT_DIR="$(pwd)"
DIST_DIR="$ROOT_DIR/dist-release"
BACKEND_DIR="$ROOT_DIR/backend"
MAC_DIR="$ROOT_DIR/client-mac"

echo "📦 Packaging Release Artifacts..."
mkdir -p "$DIST_DIR"

# 1. Package Backend
echo "🔹 Building Backend..."
cd "$BACKEND_DIR"
npm ci
npm run build
echo "   Creating backend tarball..."
tar -czvf "$DIST_DIR/backend-build.tar.gz" dist/ package.json package-lock.json
echo "✅ Backend packaged to $DIST_DIR/backend-build.tar.gz"

# 2. Package Mac Client (if on Mac)
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🔹 Building Mac Client..."
    cd "$MAC_DIR"
    
    # Check if xcodebuild is available (swift build wrapper)
    if command -v swift >/dev/null; then
        swift build --configuration release
        
        APP_NAME="MacInterviewCopilot.app"
        BUILD_DIR=".build/release"
        
        # Create App Bundle Structure manually if not using Xcode (SwiftPM doesn't auto-create .app fully for CLI app without robust tooling, but we mimic CI)
        # Note: In a real scenario, we might use 'xcodebuild archive', but here we follow CI steps.
        
        mkdir -p "$DIST_DIR/$APP_NAME/Contents/MacOS"
        mkdir -p "$DIST_DIR/$APP_NAME/Contents/Resources"
        
        cp "$BUILD_DIR/MacInterviewCopilotApp" "$DIST_DIR/$APP_NAME/Contents/MacOS/"
        cp "MacInterviewCopilot/Info.plist" "$DIST_DIR/$APP_NAME/Contents/"
        
        # Ad-hoc sign
        codesign --force --deep --sign - "$DIST_DIR/$APP_NAME"
        
        # Archive
        cd "$DIST_DIR"
        tar -czvf "mac-client-build.tar.gz" "$APP_NAME"
        rm -rf "$APP_NAME"
        echo "✅ Mac Client packaged to $DIST_DIR/mac-client-build.tar.gz"
    else
        echo "⚠️  Swift not found. Skipping Mac build."
    fi
else
    echo "⚠️  Not on macOS. Skipping Mac Client build."
fi

# Summary
echo ""
echo "🎉 Packaging Complete!"
ls -lh "$DIST_DIR"
