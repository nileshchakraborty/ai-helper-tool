#!/bin/bash

# Build the app
echo "Building MacInterviewCopilot..."
swift build

# Create App Bundle Structure
APP_NAME="MacInterviewCopilot.app"
rm -rf "$APP_NAME"
mkdir -p "$APP_NAME/Contents/MacOS"
mkdir -p "$APP_NAME/Contents/Resources"

# Copy Executable
cp .build/debug/MacInterviewCopilotApp "$APP_NAME/Contents/MacOS/"

# Copy Info.plist (Essential for Permissions)
if [ -f "MacInterviewCopilot/Info.plist" ]; then
    cp "MacInterviewCopilot/Info.plist" "$APP_NAME/Contents/Info.plist"
    echo "Info.plist copied."
else
    echo "WARNING: Info.plist not found! Privacy permissions will fail."
fi

# Sign the app locally (ad-hoc) to satisfy TCC
codesign --force --deep --sign - "$APP_NAME"

echo "Launching bundled app..."
./"$APP_NAME/Contents/MacOS/MacInterviewCopilotApp"
