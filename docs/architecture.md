# Architecture

## Overview

Mac Interview Copilot is a system designed to assist users during interviews by analyzing screen content and audio in real-time.

## Components

### 1. Client (macOS)
- **Language**: Swift
- **Responsibilities**:
    - Capture screen (CGWindowList + RegionOverlay)
    - Capture audio (AVFoundation)
    - OCR (Vision framework)
    - Stream context to backend
    - Display AI hints (Overlay UI)
- **Communication**:
    - HTTP/JSON for commands
    - SSE for real-time AI responses

### 2. Backend
- **Language**: Node.js / TypeScript
- **Framework**: Fastify
- **Services**:
    - `gateway`: API Entry point
    - `ai-orchestrator`: Manages LLM context and prompt assembly. Uses `providers/` abstraction.
    - `session`: Manages active interview sessions.
- **Streaming**: Uses Server-Sent Events (SSE) to stream partial AI responses to the client.

### 3. Data Layer
- **Postgres**: Durable storage for user profiles, session history (if enabled).
- **Redis**: Hot storage for active session context, rate limiting.

## Data Flow

1.  **Capture**: Client captures screen region & audio.
2.  **Upload**: Client sends snapshot/transcript to Backend.
3.  **Orchestration**:
    - Backend `ai-orchestrator` assembles context.
    - Selects provider (OpenAI, Anthropic, etc.).
    - Sends prompt.
4.  **Streaming**: Backend streams AI text back to Client via SSE.
5.  **Display**: Client renders text in overlay.

## Privacy & Security

- **Secrets**: Managed via environment variables (dotenv in dev, secret manager in prod).
- **Retention**: Configurable session history. "Off" means no DB persistence.
- **Permissions**: Client requests Screen Recording & Microphone access on first run.
