# Mac Interview Copilot

A privacy-first macOS interview copilot that provides real-time behavioral and coding assistance using local context (screen, audio).

## Architecture

- **Client**: Native macOS Swift app.
- **Backend**: Node.js/TypeScript + Fastify.
- **Database**: Postgres (Persistence) + Redis (Cache/Session).
- **Streaming**: Server-Sent Events (SSE).

## Getting Started

### Prerequisites

- Node.js > 20
- Docker & Docker Compose
- Xcode 15+

### Setup

1.  **Infrastructure**:
    ```bash
    cd infra
    docker-compose -f docker-compose.dev.yml up -d
    ```

2.  **Backend**:
    ```bash
    cd backend
    npm install
    npm run dev
    ```

3.  **Client**:
    Open `client-mac/MacInterviewCopilot.xcodeproj` and run.

## Privacy

This app prioritizes user privacy.
- **Session History**: Can be toggled OFF. If OFF, no data is persisted to Postgres.
- **Entitlements**: Explicitly requests Screen Recording and Microphone access.
