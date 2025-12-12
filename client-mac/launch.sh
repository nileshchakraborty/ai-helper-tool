#!/bin/bash
# Launch the already-built app without rebuilding
# This preserves TCC permissions (Screen Recording, Microphone)

cd "$(dirname "$0")"

APP_NAME="MacInterviewCopilot.app"

if [ ! -d "$APP_NAME" ]; then
    echo "❌ App not built yet. Run './run_bundled.sh' first to build."
    exit 1
fi

echo "🚀 Launching MacInterviewCopilot..."
echo "   (Not rebuilding - preserves permissions)"
open "$APP_NAME"
