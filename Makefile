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

run-mlx: mlx-start ## Alias for mlx-start

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
	cd backend && npm test -- --testPathPatterns=unit
	@echo "🧪 Running Mobile Tests..."
	cd client-mobile && npm test

test-coverage: ## Run tests with coverage report
	@echo "📊 Running Backend Tests with Coverage..."
	cd backend && npm test -- --testPathPatterns=unit --coverage
	@echo "📊 Running Mobile Tests with Coverage..."
	cd client-mobile && npm test -- --coverage

test-mobile: ## Run mobile tests only
	@echo "📱 Running Mobile Tests..."
	cd client-mobile && npm test

test-mac: ## Run Mac client tests
	@echo "🧪 Running Client Tests..."
	xcodebuild test -project client-mac/MacInterviewCopilot.xcodeproj -scheme MacInterviewCopilot -destination 'platform=macOS,arch=arm64'

# ==================== Utilities ====================

lint: ## Lint backend code
	cd backend && npm run lint

openapi-validate: ## Validate OpenAPI spec
	@./scripts/openapi-validate.sh

ci: lint openapi-validate test ## Run CI checks (lint, openapi, tests)

clean:
	rm -rf backend/node_modules
	rm -rf backend/dist
	rm -rf mlx-image-service/venv

run-mac: ## Run Mac app
	@echo "🖥️ Running Mac App..."
	@if [ -d "client-mac/MacInterviewCopilot.app/Contents" ]; then \
		echo "   📱 Found existing app bundle - launching..."; \
		open client-mac/MacInterviewCopilot.app; \
	else \
		echo "   🔨 Building app..."; \
		cd client-mac && ./run_bundled.sh; \
	fi

rebuild-mac: ## Rebuild Mac app (production-signed)
	@echo "🔨 Building production-signed Mac app..."
	@rm -rf client-mac/MacInterviewCopilot.app
	cd client-mac && xcodebuild -scheme MacInterviewCopilot -configuration Release \
		-derivedDataPath build \
		DEVELOPMENT_TEAM=H6H9D7K348 \
		CODE_SIGN_IDENTITY="Apple Development" \
		CODE_SIGN_STYLE=Automatic \
		-destination 'platform=macOS,arch=arm64' \
		-quiet
	@mkdir -p client-mac/MacInterviewCopilot.app/Contents/MacOS
	@mkdir -p client-mac/MacInterviewCopilot.app/Contents/Resources
	@cp client-mac/build/Build/Products/Release/MacInterviewCopilotApp client-mac/MacInterviewCopilot.app/Contents/MacOS/
	@cp client-mac/MacInterviewCopilot/Info.plist client-mac/MacInterviewCopilot.app/Contents/
	@if [ -f "client-mac/models/ggml-base.en.bin" ]; then cp client-mac/models/ggml-base.en.bin client-mac/MacInterviewCopilot.app/Contents/Resources/; fi
	@codesign --force --deep --sign "Apple Development" --entitlements client-mac/entitlements.plist client-mac/MacInterviewCopilot.app
	@echo "✅ Build complete! Run: make run-mac"

run-mobile: ## Run Mobile companion (Expo)
	@echo "📱 Starting Mobile Companion..."
	@echo "   Scan QR code with Expo Go app on your phone"
	@echo "   Enter your Mac's IP address in the app to connect"
	cd client-mobile && npx expo start

providers: ## Check image provider status
	@curl -s http://localhost:3000/v1/image/providers | jq .

health: ## Check backend health
	@curl -s http://localhost:3000/health | jq .

help: ## Show this help

