# Mac Interview Copilot - Project Roadmap

## 🚀 Mission
A privacy-first, verified, and stealthy AI companion for technical interviews on macOS.

## ✅ Completed Milestones

### Phase 1: Core Foundation
- [x] **Monorepo Setup**: Backend (Node/Fastify), Mac Client (Swift), Infrastructure (Docker).
- [x] **Stealth Mode**: `NSWindow` overlay, process hiding, memory-only screenshots.
- [x] **AI Orchestration**: Integration with Ollama, OpenAI, Anthropic via LangChain/LangGraph.
- [x] **MVP Features**: Chat interface, screenshot capture, behavioral coaching.

### Phase 2: Feature Expansion
- [x] **Mobile Companion**: React Native app for out-of-band updates (socket.io).
- [x] **MLX Image Service**: Local, GPU-accelerated diagram generation (FLUX.1-schnell).
- [x] **Knowledge Graph**: Personalized coaching based on weak areas (Neo4j).

### Phase 3: DevOps & Quality
- [x] **CI Pipeline**: GitHub Actions for backend/client test & build.
- [x] **Automated Packaging**: Scripts to generate deployable artifacts.
- [x] **Architecture Docs**: Updated diagrams including new services.

## 🚧 In Progress / Upcoming

### Phase 4: Advanced Intelligence (Q1 2026)
- [ ] **Audio Analysis**: Real-time transcription and "Live Assist" mode.
- [ ] **Code Execution**: Sandboxed environment to run and verify generated code.
- [ ] **Agentic Web Browsing**: Ability for AI to verify facts online.

### Phase 5: Production Hardening
- [ ] **Security Audit**: Penetration testing of local sockets and API.
- [ ] **Performance Tuning**: Optimize OCR latency and MLX model loading.
- [ ] **Installer**: `.dmg` creation for easy Mac distribution.

## 📊 Status Options
- **Stable**: Core chat, Overlay, Behavioral Agent.
- **Beta**: Coding Agent, Mobile Companion.
- **Experimental**: System Design Agent, Knowledge Graph Personalization.
