.PHONY: bootstrap dev test lint clean

bootstrap:
	@echo "Bootstrapping..."
	cd backend && npm install
	# Client pod install if needed (not for native Swift usually unless using CocoaPods)
	@echo "Ready."

dev:
	@echo "Starting Dev Environment..."
	docker-compose --env-file .env -f infra/docker-compose.dev.yml up -d
	cd backend && npm run dev

test:
	@echo "Running Backend Tests..."
	cd backend && npm test
	@echo "Running Client Tests..."
	xcodebuild test -project client-mac/MacInterviewCopilot.xcodeproj -scheme MacInterviewCopilot -destination 'platform=macOS,arch=arm64'

lint:
	cd backend && npm run lint

clean:
	rm -rf backend/node_modules
	rm -rf backend/dist

run-mac:
	@echo "Running Mac App (Bundled)..."
	cd client-mac && ./run_bundled.sh
