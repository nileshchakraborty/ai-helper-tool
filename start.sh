#!/bin/bash

# Mac Interview Copilot - Hybrid Native Startup
# Architecture:
# - DB/Redis: Docker (Lightweight)
# - Backend: Native Node.js (Performance)
# - Ollama: Native (GPU Access)
# - MLX: Native (GPU Access)

set -e

# Kill existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "MacInterviewCopilot" || true
pkill -f "npm start" || true
pkill -f "node dist/src/index.js" || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Step 1: Start DB & Redis in Docker
echo "📦 Starting DB & Redis (Docker)..."
docker compose -f infra/docker-compose.dev.yml up -d postgres redis

# Step 2: Start Local Ollama (Native)
echo "🦙 Checking Local Ollama..."
if ! pgrep -x "ollama" > /dev/null; then
    echo "   Starting Ollama server..."
    ollama serve > ollama.log 2>&1 &
    sleep 5
fi

# Ensure 14b model is pulled (Background) but wait briefly to ensure server up
echo "   Ensuring qwen2.5-coder:14b model..."
ollama pull qwen2.5-coder:14b > /dev/null 2>&1 &

# Step 3: Start MLX Image Service (Native)
echo "🎨 Checking MLX Service..."
if [ -d "mlx-image-service/venv" ]; then
    if ! lsof -i :8189 > /dev/null; then
        echo "   Starting MLX server..."
        cd mlx-image-service
        source venv/bin/activate
        nohup python server.py > ../mlx.log 2>&1 &
        cd ..
    else
        echo "   ✅ MLX is already running"
    fi
else
    echo "   ⚠️ MLX venv not found. Run 'make mlx-setup' first."
fi

# Step 4: Start Backend (Native)
echo "🚀 Starting Backend (Native)..."
cd backend
npm install > /dev/null 2>&1
echo "   🧠 Running RAG Ingestion (Agent Context)..."
npm run ingest > /dev/null
echo "   Running 'npm start' in background..."
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Step 5: Wait for Backend
echo "⏳ Waiting for Backend (Port 3000)..."
TIMEOUT=30
while ! nc -z localhost 3000; do
    sleep 1
    TIMEOUT=$((TIMEOUT-1))
    if [ $TIMEOUT -eq 0 ]; then
        echo "❌ Backend failed to start. Check backend.log"
        tail -n 20 backend.log
        exit 1
    fi
done
echo "✅ Backend is ready!"

# Health Checks
curl -s http://localhost:3000/health > /dev/null && echo "   Health Check: OK"

# Step 6: Launch Client
echo "🖥️  Starting Mac Client..."
make run-mac
