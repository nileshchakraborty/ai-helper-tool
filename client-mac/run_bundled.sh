#!/bin/bash
set -e

APP_NAME="MacInterviewCopilot.app"
EXECUTABLE_NAME="MacInterviewCopilotApp"

echo "Building MacInterviewCopilot..."
swift build -c debug

echo "Creating bundle structure..."
rm -rf "$APP_NAME"
mkdir -p "$APP_NAME/Contents/MacOS"
mkdir -p "$APP_NAME/Contents/Resources"

cp .build/debug/"$EXECUTABLE_NAME" "$APP_NAME/Contents/MacOS/"
cp MacInterviewCopilot/Info.plist "$APP_NAME/Contents/Info.plist"
echo "Info.plist copied."

# Download Whisper Model if needed
MODEL_URL="https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin"
MODEL_PATH="$APP_NAME/Contents/Resources/ggml-base.en.bin"

if [ ! -f "$MODEL_PATH" ]; then
    echo "Downloading Whisper model (base.en)... This may take a moment."
    curl -L "$MODEL_URL" -o "$MODEL_PATH"
fi

# Create Entitlements for TCC
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

echo "Signing with entitlements..."
codesign --force --deep --sign - --entitlements entitlements.plist "$APP_NAME"

echo "Launching bundled app..."
# Use open -W to wait for the app to finish (and ensure it runs as a bundle for TCC headers)
open -W "$APP_NAME"
