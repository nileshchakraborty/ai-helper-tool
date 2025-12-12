.PHONY: bootstrap dev test lint clean start stop logs mlx-setup mlx-start run-mac run-all

run-all: ## Start everything (backend + frontend)
	@./start.sh

# ==================== Setup ====================

bootstrap:
	@echo "🔧 Bootstrapping..."
	cd backend && npm install
	@echo "✅ Ready."

mlx-setup:
	@echo "🎨 Setting up MLX image service..."
	cd mlx-image-service && chmod +x setup.sh && ./setup.sh
	@echo "✅ MLX setup complete. Run 'make mlx-start' to start."

# ==================== Start Services ====================

start: ## Start all services (Docker + MLX)
	@echo "🚀 Starting all services..."
	docker compose -f infra/docker-compose.dev.yml up -d
	@echo "⏳ Waiting for services..."
	sleep 3
	@echo "📊 Checking health..."
	curl -s http://localhost:3000/health | jq . || echo "Backend not ready yet"
	@echo ""
	@echo "✅ Services started!"
	@echo "   Backend: http://localhost:3000"
	@echo "   Ollama:  http://localhost:11434"
	@echo ""
	@echo "💡 To start MLX (fast images): make mlx-start"
	@echo "💡 To view logs: make logs"

stop: ## Stop all Docker services
	@echo "🛑 Stopping services..."
	docker compose -f infra/docker-compose.dev.yml down
	@echo "✅ Stopped."

mlx-start: ## Start MLX image service (requires setup first)
	@echo "🎨 Starting MLX image service..."
	@echo "   This will run in foreground. Press Ctrl+C to stop."
	cd mlx-image-service && source venv/bin/activate && python server.py

logs: ## View backend logs
	docker compose -f infra/docker-compose.dev.yml logs -f backend

logs-all: ## View all service logs
	docker compose -f infra/docker-compose.dev.yml logs -f

# ==================== Development ====================

dev: ## Start dev environment (auto-reload)
	@echo "🔧 Starting Dev Environment..."
	docker compose -f infra/docker-compose.dev.yml up -d
	cd backend && npm run dev

build: ## Build backend
	cd backend && npm run build

# ==================== Testing ====================

test: ## Run all tests
	@echo "🧪 Running Backend Tests..."
	cd backend && npm test

test-mac: ## Run Mac client tests
	@echo "🧪 Running Client Tests..."
	xcodebuild test -project client-mac/MacInterviewCopilot.xcodeproj -scheme MacInterviewCopilot -destination 'platform=macOS,arch=arm64'

# ==================== Utilities ====================

lint:
	cd backend && npm run lint

clean:
	rm -rf backend/node_modules
	rm -rf backend/dist
	rm -rf mlx-image-service/venv

run-mac: ## Run Mac app
	@echo "🖥️ Running Mac App..."
	cd client-mac && ./run_bundled.sh

providers: ## Check image provider status
	@curl -s http://localhost:3000/v1/ai/image/providers | jq .

health: ## Check backend health
	@curl -s http://localhost:3000/health | jq .

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

