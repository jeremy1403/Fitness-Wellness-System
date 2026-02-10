# ==============================================================================
# Fitness & Wellness Platform — Makefile
# ==============================================================================

.PHONY: help build up down restart logs shell \
        install migrate seed fresh test lint \
        frontend-shell frontend-build frontend-lint \
        mysql redis mailpit clean

# Default target
help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ==============================================================================
# Docker
# ==============================================================================

build: ## Build all containers
	docker compose build

up: ## Start all containers in background
	docker compose up -d

down: ## Stop all containers
	docker compose down

restart: ## Restart all containers
	docker compose restart

logs: ## Tail container logs (usage: make logs or make logs s=app)
	docker compose logs -f $(s)

shell: ## Open a shell in the app container
	docker compose exec app sh

# ==============================================================================
# Laravel Setup
# ==============================================================================

install: ## Install dependencies and generate app key
	docker compose exec app composer install
	docker compose exec app php artisan key:generate --force

migrate: ## Run database migrations
	docker compose exec app php artisan migrate

seed: ## Run database seeders
	docker compose exec app php artisan db:seed

fresh: ## Fresh migration + seed (destroys all data)
	docker compose exec app php artisan migrate:fresh --seed

# ==============================================================================
# Development
# ==============================================================================

test: ## Run PHPUnit tests
	docker compose exec app php artisan test

lint: ## Run Laravel Pint (code formatting)
	docker compose exec app ./vendor/bin/pint

tinker: ## Open Laravel Tinker REPL
	docker compose exec app php artisan tinker

routes: ## List all registered routes
	docker compose exec app php artisan route:list

clear: ## Clear all Laravel caches
	docker compose exec app php artisan optimize:clear

# ==============================================================================
# Frontend (Next.js)
# ==============================================================================

frontend-shell: ## Open a shell in the frontend container
	docker compose exec frontend sh

frontend-build: ## Rebuild the frontend container
	docker compose build frontend

frontend-lint: ## Run ESLint inside the frontend container
	docker compose exec frontend npx eslint .

# ==============================================================================
# Database Tools
# ==============================================================================

mysql: ## Open MySQL CLI
	docker compose exec mysql mysql -u $${DB_USERNAME:-fw_user} -p$${DB_PASSWORD:-secret} $${DB_DATABASE:-fitness_wellness}

dump: ## Dump database to database/sql/init_dump.sql
	docker compose exec mysql mysqldump -u $${DB_USERNAME:-fw_user} -p$${DB_PASSWORD:-secret} $${DB_DATABASE:-fitness_wellness} > backend/database/sql/init_dump.sql

# ==============================================================================
# Other Services
# ==============================================================================

redis: ## Open Redis CLI
	docker compose exec redis redis-cli

mailpit: ## Open Mailpit in browser (macOS)
	@echo "Mailpit UI: http://localhost:$${MAILPIT_PORT:-8025}"

# ==============================================================================
# Cleanup
# ==============================================================================

clean: ## Remove all containers, volumes, and images
	docker compose down -v --rmi local
	@echo "Cleaned up all containers, volumes, and local images."

# ==============================================================================
# Quick Start
# ==============================================================================

init: ## First-time setup: copy env, build, start, install deps, migrate, seed
	@test -f backend/.env || (cp backend/.env.example backend/.env && echo "==> Created backend/.env from .env.example")
	@echo "==> Building containers..."
	docker compose build
	@echo "==> Starting containers..."
	docker compose up -d
	@echo "==> Waiting for MySQL to be ready..."
	@sleep 10
	@echo "==> Installing Composer dependencies..."
	docker compose exec app composer install
	@echo "==> Generating app key..."
	docker compose exec app php artisan key:generate --force
	@echo "==> Running migrations..."
	docker compose exec app php artisan migrate
	@echo "==> Seeding database..."
	docker compose exec app php artisan db:seed
	@echo ""
	@echo "==> Done! Services available at:"
	@echo "    Frontend:  http://localhost:$${FRONTEND_PORT:-3000}"
	@echo "    API:       http://localhost:$${APP_PORT:-8000}"
	@echo "    Mailpit:   http://localhost:$${MAILPIT_PORT:-8025}"
