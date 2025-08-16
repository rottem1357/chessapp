set -e

echo "Stopping Auth Service..."

docker-compose down

echo "Auth Service stopped!"
echo "To remove data volumes as well, run: docker-compose down -v"

# microservices/auth/Makefile
# Makefile for Auth Service

.PHONY: help build run stop clean logs test migrate seed

# Default target
help:
	@echo "Available commands:"
	@echo "  build    - Build Docker image"
	@echo "  run      - Start services with Docker Compose"
	@echo "  stop     - Stop all services"
	@echo "  clean    - Stop services and remove volumes"
	@echo "  logs     - Show service logs"
	@echo "  test     - Run tests"
	@echo "  migrate  - Run database migrations"
	@echo "  seed     - Seed database with test data"
	@echo "  dev      - Start in development mode"

# Build Docker image
build:
	@chmod +x scripts/docker-build.sh
	@./scripts/docker-build.sh

# Start services
run:
	@chmod +x scripts/docker-run.sh
	@./scripts/docker-run.sh

# Stop services
stop:
	@chmod +x scripts/docker-stop.sh
	@./scripts/docker-stop.sh

# Clean up everything
clean:
	docker-compose down -v
	docker image rm chess-auth-service:latest || true

# Show logs
logs:
	docker-compose logs -f auth-service

# Run tests
test:
	npm test

# Run migrations
migrate:
	docker-compose exec auth-service npm run migrate

# Seed database
seed:
	docker-compose exec auth-service npm run seed

# Development mode
dev:
	docker-compose -f docker-compose.yml -f docker-compose.override.yml up