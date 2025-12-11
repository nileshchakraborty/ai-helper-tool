# Mac Interview Copilot - Client

Native macOS application for the Interview Copilot system.

## Requirements

- macOS 14.0+
- Xcode 15+ (for development)
- Swift 5.9+

## Quick Start

```bash
# Build and run
swift build
swift run MacInterviewCopilotApp

# Or open in Xcode
open Package.swift
```

## Usage

| Hotkey | Action |
|--------|--------|
| `Cmd + Shift + Space` | Show/Hide overlay window |

### Modes

- **Behavioral**: STAR method coaching for behavioral interview questions
- **Coding**: Code review, optimization, and algorithm assistance

### Features

- 📝 **Context Field**: Add job description or relevant context  
- 💻 **Code Field**: Paste code snippets for coding mode
- 📷 **Screen Capture**: Click camera icon to OCR visible screen content
- ⚡ **Real-time Streaming**: AI responses appear as they're generated

## Configuration

The client connects to `http://localhost:3000` by default.

To change this, modify `Core/Config/AppConfiguration.swift`:

```swift
static let apiBaseURL = "http://localhost:3000"
```

## Project Structure

```
MacInterviewCopilot/
├── App/
│   ├── MacInterviewCopilotApp.swift  # Entry point
│   └── OverlayView.swift             # Floating window
├── Features/
│   └── Chat/
│       └── ChatView.swift            # Main chat interface
└── Core/
    ├── Config/
    │   ├── AppConfiguration.swift    # API settings
    │   └── AppState.swift            # Global state
    ├── Networking/
    │   ├── StreamingClient.swift     # SSE client
    │   └── OpenAPIClient/            # Generated API client
    ├── Services/
    │   └── KeychainService.swift     # Token storage
    └── SystemIntegration/
        ├── Hotkeys/
        │   └── GlobalHotkeyManager.swift
        ├── ScreenCapture/
        │   └── ScreenCaptureManager.swift
        └── OCR/
            └── OCRService.swift
```

## Permissions

The app requires these macOS permissions:

| Permission | Purpose |
|------------|---------|
| **Screen Recording** | Capture screen for OCR context |
| **Accessibility** | Register global hotkeys |
| **Microphone** | (Future) Audio capture for transcription |

Grant these in **System Preferences > Privacy & Security**.

## Development

### Regenerate OpenAPI Client

If the backend API changes:

```bash
cd ..
./scripts/generate-client.sh
```

### Running Tests

```bash
swift test
```

### Debugging

- **PromptDebug** features are enabled only in Debug builds
- Use Xcode's console to view network requests and responses
