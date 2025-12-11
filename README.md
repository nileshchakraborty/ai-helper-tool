# Mac Interview Copilot

A privacy-first macOS interview copilot that provides real-time behavioral and coding assistance using local AI (Ollama) or cloud providers (OpenAI, Anthropic).

## Features

- 🎯 **Behavioral Interview Coaching** - STAR method guidance for behavioral questions
- 💻 **Coding Assistance** - Code review, optimization, and algorithm help
- 🖥️ **Screen Capture** - OCR to extract context from your screen
- 🔒 **Privacy-First** - Local AI with Ollama, optional cloud providers
- ⚡ **Real-Time Streaming** - Server-Sent Events (SSE) for instant responses
- 🔑 **MCP Integration** - Model Context Protocol for extensible AI tools

## Quick Start

```bash
# 1. Copy environment config
cp backend/.env.example backend/.env

# 2. Generate JWT secret
./scripts/generate_jwt_secret.sh
# Add the output to your .env

# 3. Start Docker services (includes Ollama)
docker compose -f infra/docker-compose.dev.yml up -d

# 4. Run the Mac client
cd client-mac && swift run MacInterviewCopilotApp
```

**Global Hotkey**: Press `Cmd + Shift + Space` to show/hide the overlay.

## Documentation

- 📖 [**RUNBOOK.md**](./RUNBOOK.md) - Complete setup, usage, and troubleshooting guide
- 🏗️ [**Architecture**](./docs/architecture.md) - System design and components
- 🔌 [**API Reference**](./rest.http) - Test all API endpoints (VS Code REST Client)

## Architecture Overview

```
Mac Client (Swift)  ─────────► Backend (Node.js/Fastify)
       │                              │
       │  HTTP/SSE                    │
       │                              ▼
       │                    ┌─────────────────┐
       │                    │  MCP Service    │
       │                    │  Layer (Tools)  │
       │                    └────────┬────────┘
       │                             │
       ▼                             ▼
┌──────────────┐            ┌─────────────────┐
│ Screen/Audio │            │ Ollama/OpenAI/  │
│   Capture    │            │   Anthropic     │
└──────────────┘            └─────────────────┘
                                     │
                            ┌────────┴────────┐
                            │   PostgreSQL    │
                            │     Redis       │
                            └─────────────────┘
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| **Mac Client** | Swift, SwiftUI, Vision (OCR) |
| **Backend** | Node.js, TypeScript, Fastify |
| **AI Providers** | Ollama (local), OpenAI, Anthropic |
| **MCP Server** | Model Context Protocol for AI tools |
| **Database** | PostgreSQL (persistence), Redis (cache) |
| **Streaming** | Server-Sent Events (SSE) |

## Environment Variables

```bash
# AI Providers (set at least one)
OLLAMA_HOST=http://ollama:11434
OLLAMA_MODEL=llama3.2
OPENAI_API_KEY=sk-...        # Optional
ANTHROPIC_API_KEY=sk-ant-... # Optional

# Security
JWT_SECRET=<generate with scripts/generate_jwt_secret.sh>
```

See [backend/.env.example](./backend/.env.example) for all options.

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/generate_jwt_secret.sh` | Generate secure JWT secret |
| `scripts/generate-client.sh` | Regenerate OpenAPI Swift client |
| `scripts/validate_ollama.sh` | Validate Ollama connection |

## Privacy

This app prioritizes user privacy:
- **Local AI**: Ollama runs entirely on your machine
- **Session History**: Toggle OFF to disable all data persistence
- **Permissions**: Explicitly requests Screen Recording and Microphone access
- **No Telemetry**: No data sent anywhere except your configured AI provider

## License

MIT
