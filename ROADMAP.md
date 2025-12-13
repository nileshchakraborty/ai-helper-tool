# 🗺️ Project Roadmap & Status

This document tracks the development progress of the Mac Interview Copilot.

## 🟢 Current Status: v1.0 Release Candidate
**Stability**: Stable / Beta
**Latest Feature**: Stealth Mode & Auto-Capture Integration

---

## ✅ Completed Milestones

### **Phase 1: Foundation & AI Framework**
- [x] **LangChain Integration**: Provider factory, chain templates, and unified model interface.
- [x] **Backend API**: Fastify server with SSE streaming, Auth (JWT), and Rate Limiting.
- [x] **Docker Infrastructure**: Postgres, Redis, and service orchestration.

### **Phase 2: RAG & Knowledge Graph**
- [x] **ChromaDB Integration**: Vector store for document retrieval and context awareness.
- [x] **Neo4j Integration**: Graph database for entity relationship mapping.
- [x] **Hybrid Search**: Orchestrator combining vector search and graph traversal.

### **Phase 3: Mac Client & Stealth Features**
- [x] **Native App**: SwiftUI-based macOS application with overlay window.
- [x] **Stealth Mode**: Invisible screenshot capture (`LSUIElement`, `.screenSaver` level).
- [x] **Screen Capture**: OCR pipeline with privacy-focused local processing.
- [x] **Auto-Pilot**: Automatic 30s interval capture and analysis loop.
- [x] **Secure Auth**: Keychain integration with JWT fallback.

### **Phase 4: CI/CD & DevEx (Recently Completed)**
- [x] **Pipeline Hardening**: GitHub Actions with Mac unit tests and Docker validation.
- [x] **Release Automation**: Automatic packaging of `.app` bundles and backend artifacts.
- [x] **Artifact Downloads**: Direct download of build artifacts from CI runs.

---

## 🚧 In Progress / Next Steps

### **Phase 5: Performance & Optimization**
- [ ] **MLX On-Device Optimizations**: Further tune Flux.1 image generation for M1/M2 chips.
- [ ] **Mobile App Polish**: Feature parity for React Native companion app.
- [ ] **Latency Reduction**: Optimizing WebSocket event loop for real-time coaching.

### **Phase 6: Advanced Features**
- [ ] **Voice Mode**: Real-time bidirectional voice coaching (using Whisper + TTS).
- [ ] **Cloud Sync**: Optional encrypted cloud backup for session history (currently local-only).
- [ ] **Team Mode**: Multi-user shared context for mock interview practice.

---

## 🛠 Feature Traceability

| Feature | Backend | Mac Client | Status |
|---------|:-------:|:----------:|:------:|
| behavioral/answer | ✅ | ✅ | Live |
| coding/assist | ✅ | ✅ | Live |
| system-design | ✅ | ✅ | Live |
| agent/chat | ✅ | ✅ | Live |
| stealth-mode | N/A | ✅ | Live |
| auto-capture | N/A | ✅ | Live |
| image-gen (MLX) | ✅ | 🚧 | Beta |

---

> *Last Updated: 2025-12-13*
