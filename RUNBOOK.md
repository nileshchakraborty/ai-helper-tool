# Mac Interview Copilot - Runbook

Complete guide for setting up, running, and using the Mac Interview Copilot application.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Running with Docker](#running-with-docker)
- [Running the Mac Client](#running-the-mac-client)
- [Using the App](#using-the-app)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| **macOS** | 14.0+ | Required for SwiftUI features |
| **Xcode** | 15+ | For building the Mac client |
| **Node.js** | 20+ | Backend runtime |
| **Docker** | Latest | For running services |
| **Docker Compose** | v2+ | Container orchestration |

---

## Quick Start

```bash
# 1. Clone and setup
git clone <repo-url>
cd ai-manager

# 2. Generate JWT secret
./scripts/generate_jwt_secret.sh

## Standalone Mode (Offline) 🗽
The app can run without the Node.js backend ("Direct Mode") to save memory and reduce latency.

1. **Prerequisite**: Ensure Ollama is running (`ollama serve`).
2. **Enable**: In the Chat view, click the **Gear Icon** -> **Standalone (Offline)**.
3. **Behavior**:
   - The app connects directly to `localhost:11434`.
   - **Fallback**: If Ollama Direct fails, it automatically tries the Node Backend.
   - **Models**: Uses `qwen2.5-coder:14b` for code and `llama3.2-vision` for screenshots.

# 3. Create .env file (copy from example)
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

# 4. Start Docker services
docker compose -f infra/docker-compose.dev.yml up -d

# 5. Verify backend is running
curl http://localhost:3000/health
# Expected: {"status":"ok"}

# 6. Run the Mac client
cd client-mac
swift run MacInterviewCopilotApp

# 7. (Optional) Run RAG Ingestion
# To enable Knowledge Agent with custom docs:
cd backend
npm run ingest
```

---

## Environment Configuration

### Required `.env` Variables

Create `backend/.env` with:

```bash
# Server
PORT=3000
NODE_ENV=development

# Database (Docker uses internal hostnames)
REDIS_URL=redis://redis:6379
DATABASE_URL=postgresql://dev:dev@postgres:5432/maccopilot

# Security
JWT_SECRET=<generate with ./scripts/generate_jwt_secret.sh>

# AI Providers (set at least one)
OPENAI_API_KEY=sk-...          # Optional
ANTHROPIC_API_KEY=sk-ant-...   # Optional

# Ollama (Local AI - recommended for privacy)
OLLAMA_HOST=http://ollama:11434
OLLAMA_MODEL=llama3.2
OLLAMA_API_KEY=                 # Optional, for remote servers
```

### Root `.env` for Docker Compose

Create `/.env` at repository root:

```bash
# These are read by docker-compose.dev.yml
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
OLLAMA_MODEL=llama3.2
```

---

## Running with Docker

### Start All Services

```bash
docker compose -f infra/docker-compose.dev.yml up -d
```

This starts:
- **backend** - Node.js API server (port 3000)
- **postgres** - PostgreSQL database (port 5432)
- **redis** - Redis cache (port 6379)
- **ollama** - Local AI server (port 11434)

### Useful Commands

```bash
# Check status
docker compose -f infra/docker-compose.dev.yml ps

# View backend logs
docker compose -f infra/docker-compose.dev.yml logs -f backend

# Rebuild after code changes
docker compose -f infra/docker-compose.dev.yml build backend
docker compose -f infra/docker-compose.dev.yml up -d backend

# Stop all services
docker compose -f infra/docker-compose.dev.yml down

# Full reset (removes volumes)
docker compose -f infra/docker-compose.dev.yml down -v
```

### Pull Additional Ollama Models

```bash
# Pull a new model
docker exec -it infra-ollama-1 ollama pull deepseek-coder

# List available models
docker exec -it infra-ollama-1 ollama list

# Update OLLAMA_MODEL in .env and restart
```

---

## Running the Mac Client

### Option 1: Swift Package Manager (Recommended)

```bash
cd client-mac
swift build
swift run MacInterviewCopilotApp
```

### Option 2: Xcode

```bash
cd client-mac
open Package.swift
# Xcode will open - press Cmd+R to run
```

### Granting Permissions

The app will request:
- **Screen Recording** - For capturing interview questions
- **Accessibility** - For global hotkeys

Go to **System Preferences > Privacy & Security** to grant these.

---

## Using the App

### Privacy & Accessibility Features

The app is designed with **user privacy and accessibility** in mind:

| Feature | Status | Description |
|---------|--------|-------------|
| **Floating Overlay** | ✅ | Non-intrusive overlay for note-taking |
| **Minimal UI Mode** | ✅ | Compact view for focused workflows |
| **Opacity Control** | ✅ | Adjustable transparency for comfort |
| **Click-through Mode** | ✅ | Window becomes transparent to clicks |
| **Native macOS** | ✅ | Pure Swift, no Electron/browser overhead |
| **Local Processing** | ✅ | Ollama option for offline, private AI |
| **Stealth UI Toggle** | ✅ | Hides bulky editors, leaving only essential buttons |

### Hotkeys

| Shortcut | Action |
|----------|--------|
| `Cmd + Shift + Space` | Show/Hide overlay window |
| `Cmd + Shift + T` | Toggle click-through mode |
| `Cmd + Shift + O` | Cycle opacity (100% → 80% → 60% → 40%) |
| `Cmd + Q` | Quit application |

### Modes

| Mode | Use Case |
|------|----------|
| **Behavioral** | STAR method coaching for behavioral questions |
| **Coding** | Code review, optimization, and algorithm help |
| **System Design** | Architecture diagrams and scalability discussion |
| **Meeting** | Real-time transcript/slide analysis for Teams/Zoom |
| **Agent (Swarm)** | Auto-routing to the best expert (Coding, Knowledge, Meeting) |

### Workflow

### Workflow

1. **Press `Cmd + Shift + Space`** to open the overlay
2. **Select Display**: If you have multiple monitors, pick the target display from the header.
3. **Select Mode**:
   - **Agent (Swarm)**: Best default. Auto-detects context from text + image.
   - **Meeting**: Use for Zoom/Teams calls. Paste transcript notes.
   - **Coding**: Use for LeetCode. Supports Split-Screen parsing.
4. **Stealth Mode**: Toggle "Stealth" in header to hide text boxes for minimal footprint.
5. **Capture screen** (📷 button) to OCR visible text.
6. **Type your question** and click "Ask".
7. **Stream response** appears in real-time.

### Click-through Mode

When enabled (`Cmd + Shift + T`):
- All mouse clicks pass through the overlay
- Overlay becomes semi-transparent (50% opacity)
- You can interact with apps behind the overlay
- Press `Cmd + Shift + T` again to disable

### Closing the App

- **Hide overlay**: Press `Cmd + Shift + Space`
- **Quit app**: Press `Cmd + Q` or terminal `Ctrl + C`


---

## API Reference

### Health Check

```bash
curl http://localhost:3000/health
```

### AI Endpoints (SSE Streaming)

All AI endpoints are prefixed with `/v1/`:

```bash
# Behavioral coaching
curl -X POST http://localhost:3000/v1/behavioral/answer \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "question": "Tell me about a challenging project",
    "context": "Senior Engineer role",
    "provider": "ollama"
  }'

# Coding assistance
curl -X POST http://localhost:3000/v1/coding/assist \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "question": "Optimize this function",
    "code": "function sum(arr) { ... }",
    "provider": "ollama"
  }'
```

### Full API Testing

Use the included `rest.http` file with VS Code REST Client extension.

---

## Troubleshooting

### Backend won't start

```bash
# Check logs
docker compose -f infra/docker-compose.dev.yml logs backend

# Common issues:
# - Port 3000 in use: Stop other services
# - Missing .env: Copy from .env.example
```

### Ollama not responding

```bash
# Check Ollama status
curl http://localhost:11434/api/version

# Check if model is pulled
docker exec -it infra-ollama-1 ollama list

# Pull model if missing
docker exec -it infra-ollama-1 ollama pull llama3.2
```

### Mac client hotkey not working

1. Grant **Accessibility** permission in System Preferences
2. Restart the app
3. Check if another app is using `Cmd + Shift + Space`

### "Provider not found" error

```bash
# This means the provider is not configured
# For Ollama: Ensure OLLAMA_HOST and OLLAMA_MODEL are set
# For OpenAI/Anthropic: Ensure API keys are set in .env

# Verify with:
docker compose -f infra/docker-compose.dev.yml logs backend | grep "key missing"
```

### Database connection errors

```bash
# Check if Postgres is running
docker compose -f infra/docker-compose.dev.yml ps postgres

# Reset database
docker compose -f infra/docker-compose.dev.yml down -v
docker compose -f infra/docker-compose.dev.yml up -d
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Mac Client (Swift)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │ ChatView    │  │ Hotkey Mgr  │  │ Screen Capture  │ │
│  └──────┬──────┘  └─────────────┘  └────────┬────────┘ │
│         │                                    │         │
│         └──────────┬────────────────────────┘         │
│                    │ HTTP/SSE                          │
└────────────────────┼───────────────────────────────────┘
                     │
┌────────────────────┼───────────────────────────────────┐
│                    ▼                                    │
│              Backend (Node.js/Fastify)                  │
│  ┌─────────────────────────────────────────────────┐  │
│  │              API Gateway (Routes)                │  │
│  └─────────────────────┬───────────────────────────┘  │
│                        │                               │
│  ┌─────────────────────┼───────────────────────────┐  │
│  │         MCP Service Layer (Tools)                │  │
│  └─────────────────────┬───────────────────────────┘  │
│                        │                               │
│  ┌──────────┬──────────┼──────────┬──────────────┐   │
│  │ Profile  │ Session  │   AI     │  Ollama/     │   │
│  │ Service  │ Service  │ Router   │  OpenAI/     │   │
│  │          │          │          │  Anthropic   │   │
│  └────┬─────┴────┬─────┴────┬─────┴──────────────┘   │
│       │          │          │                         │
└───────┼──────────┼──────────┼─────────────────────────┘
        │          │          │
   ┌────┴────┐ ┌───┴───┐ ┌────┴────┐
   │Postgres │ │ Redis │ │ Ollama  │
   └─────────┘ └───────┘ └─────────┘
```

---


## Testing

### Run All Tests

```bash
# Run backend + mobile tests
make test

# Run with coverage reports
make test-coverage
```

### Backend Tests

```bash
cd backend

# Run unit tests only
npm test -- --testPathPatterns=unit

# Run with coverage
npm test -- --testPathPatterns=unit --coverage

# Run E2E tests (requires running server)
npm test -- --testPathPatterns=e2e
```

**Test Coverage:**
| File | Coverage |
|------|----------|
| `socket.ts` | 77.77% |
| `mlx.ts` | 90% |
| `orchestrator.ts` | 55.14% |
| `env.ts` | 100% |

### Mobile Tests

```bash
cd client-mobile
npm test
npm test -- --coverage
```

### Mac Client Tests

```bash
cd client-mac
swift test
```

---

## Mobile Companion

The Mobile Companion app allows you to view AI responses on your phone in real-time.

### Setup

```bash
# 1. Start the backend
./start.sh

# 2. Start the mobile app
make run-mobile

# 3. On your phone:
#    - Install Expo Go from App Store
#    - Scan the QR code
#    - Enter your Mac's IP address (e.g., 192.168.1.5)
#    - Tap Connect
```

### How It Works

1. **Backend** runs Socket.IO server on port 3000
2. **Mobile app** connects via WebSocket
3. When AI generates a response on Mac, it broadcasts to all connected devices
4. Phone displays the response in real-time

### Troubleshooting Mobile

- **Can't connect**: Ensure phone and Mac are on same WiFi network
- **Find Mac IP**: Run `ifconfig en0 | grep inet` on Mac
- **Connection error**: Check if backend is running (`curl localhost:3000/health`)

---

## Scripts Reference

| Script | Purpose |
|--------|---------|
| `scripts/generate_jwt_secret.sh` | Generate secure JWT secret |
| `scripts/generate-client.sh` | Regenerate OpenAPI Swift client |
| `scripts/validate_ollama.sh` | Validate Ollama connection |
| `client-mac/run_bundled.sh` | Build, sign, and launch Mac app |

## Makefile Commands

| Command | Purpose |
|---------|---------|
| `make start` | Start all Docker services |
| `make run-mac` | Run the Mac client |
| `make run-mobile` | Run Mobile companion (Expo) |
| `make test` | Run all tests |
| `make test-coverage` | Run tests with coverage |
| `make mlx-setup` | Set up MLX image generation |
| `make mlx-start` | Start MLX image server |
| `make health` | Check backend health |
| `make providers` | Check image providers |

---

*Last updated: December 2024*

