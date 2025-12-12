#!/bin/bash
set -e
cd "$(dirname "$0")"

APP_NAME="MacInterviewCopilot.app"
EXECUTABLE_NAME="MacInterviewCopilotApp"
BUNDLE_ID="com.interview.copilot"

echo "Building MacInterviewCopilot..."
swift build -c debug

echo "Creating bundle structure..."
rm -rf "$APP_NAME"
mkdir -p "$APP_NAME/Contents/MacOS"
mkdir -p "$APP_NAME/Contents/Resources"

cp .build/debug/"$EXECUTABLE_NAME" "$APP_NAME/Contents/MacOS/"
cp MacInterviewCopilot/Info.plist "$APP_NAME/Contents/Info.plist"
echo "Info.plist copied."

# Download Whisper Model (Cached)
MODEL_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin"
CACHE_DIR="models"
mkdir -p "$CACHE_DIR"
CACHE_PATH="$CACHE_DIR/ggml-base.en.bin"

if [ ! -f "$CACHE_PATH" ]; then
    echo "Downloading Whisper model (base.en)... This may take a moment."
    curl -L "$MODEL_URL" -o "$CACHE_PATH"
fi

cp "$CACHE_PATH" "$APP_NAME/Contents/Resources/"

# Create Entitlements for TCC (Screen Recording + Mic)
cat > entitlements.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.device.audio-input</key>
    <true/>
    <key>com.apple.security.device.microphone</key>
    <true/>
    <key>com.apple.security.get-task-allow</key>
    <true/>
</dict>
</plist>
EOF

# Use ad-hoc signing (avoids keychain prompts)
# Permissions persist if you use ./launch.sh instead of rebuilding
echo "Signing with entitlements (ad-hoc)..."
codesign --force --deep --sign - --entitlements entitlements.plist --identifier "$BUNDLE_ID" "$APP_NAME"

echo "Launching bundled app..."
# Use open -W to wait for the app to finish (and ensure it runs as a bundle for TCC headers)
open -W "$APP_NAME"

