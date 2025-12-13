#!/bin/bash

# Mac Interview Copilot - Hybrid Native Startup
# Architecture:
# - DB/Redis/ChromaDB/Neo4j: Docker (Data Layer)
# - Backend: Native Node.js (Performance)
# - Ollama: Native (GPU Access)
# - MLX: Native (GPU Access)

set -e

echo "🚀 Mac Interview Copilot - Starting..."
echo ""

# Kill existing processes
echo "🧹 Cleaning up old processes..."
pkill -f "MacInterviewCopilot" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
pkill -f "node dist/src/index.js" 2>/dev/null || true
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Step 1: Start DB, Redis, and AI Framework Services in Docker
echo "📦 Starting Docker Services..."
docker compose -f infra/docker-compose.dev.yml up -d postgres redis chromadb neo4j 2>/dev/null || \
docker compose -f infra/docker-compose.dev.yml up -d postgres redis 2>/dev/null

# Step 2: Start Local Ollama (Native for GPU)
echo "🦙 Checking Local Ollama..."
if ! pgrep -x "ollama" > /dev/null; then
    echo "   Starting Ollama server..."
    ollama serve > ollama.log 2>&1 &
    sleep 3
else
    echo "   ✅ Ollama is already running"
fi

# Ensure models are available (background pull)
echo "   Ensuring AI models..."
ollama pull qwen2.5-coder:14b > /dev/null 2>&1 &
ollama pull llama3.2-vision > /dev/null 2>&1 &

# Step 3: Start MLX Image Service (Native for Metal GPU)
# Export API Token for Client Fallback (Dev Only)
export API_TOKEN="dev_token_123"

# Step 3: Start MLX Image Service (Native for Metal GPU)
echo "🎨 Checking MLX Service..."
if [ ! -d "mlx-image-service/venv" ]; then
    echo "   ⚙️  MLX venv not found. Running setup..."
    make mlx-setup
fi

if ! lsof -i :8189 > /dev/null 2>&1; then
    echo "   🚀 Starting MLX server..."
    # Run in background without blocking
    cd mlx-image-service && source venv/bin/activate && python server.py > ../mlx.log 2>&1 &
    cd ..
else
    echo "   ✅ MLX is already running"
fi

# Step 4: Start Backend (Native Node.js)
echo "🚀 Starting Backend..."
cd backend

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "   Installing dependencies..."
    npm install --legacy-peer-deps > /dev/null 2>&1
fi

# Build TypeScript
echo "   Building TypeScript..."
npm run build > /dev/null 2>&1

# Seed ChromaDB if available
if curl -s http://localhost:8000/api/v2/heartbeat > /dev/null 2>&1; then
    echo "   📚 Seeding ChromaDB with interview data..."
    npx ts-node scripts/seed-interview-questions.ts > /dev/null 2>&1 || true
fi

echo "   Starting server..."
npm start > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Step 5: Wait for Backend
echo "⏳ Waiting for Backend (Port 3000)..."
TIMEOUT=30
while ! nc -z localhost 3000 2>/dev/null; do
    sleep 1
    TIMEOUT=$((TIMEOUT-1))
    if [ $TIMEOUT -eq 0 ]; then
        echo "❌ Backend failed to start. Check backend.log"
        tail -n 20 backend.log
        exit 1
    fi
done

# Health Checks
echo ""
echo "✅ Services Ready!"
echo "   Backend:  http://localhost:3000"
curl -s http://localhost:3000/health > /dev/null && echo "   Health:   OK"
curl -s http://localhost:8000/api/v2/heartbeat > /dev/null 2>&1 && echo "   ChromaDB: Available"
curl -s http://localhost:7474 > /dev/null 2>&1 && echo "   Neo4j:    Available"

# Step 6: Launch Client
echo ""
echo "🖥️  Starting Mac Client..."
make run-mac
