.PHONY: dev-backend dev-frontend dev-db test lint migrate seed clean help

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

dev-db: ## Start databases (PostgreSQL, MongoDB, Redis)
	docker-compose up -d

dev-backend: ## Start FastAPI backend with hot reload
	cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

dev-frontend: ## Start Next.js frontend dev server
	cd frontend && npm run dev

test: ## Run all tests
	cd backend && python -m pytest tests/ -v

test-cov: ## Run tests with coverage
	cd backend && python -m pytest tests/ -v --cov=app --cov-report=html

lint: ## Run linter (ruff)
	cd backend && ruff check app/ tests/

format: ## Format code (ruff)
	cd backend && ruff format app/ tests/

migrate: ## Run Alembic migrations
	cd backend && alembic upgrade head

migrate-gen: ## Generate new Alembic migration
	cd backend && alembic revision --autogenerate -m "$(msg)"

clean: ## Clean build artifacts
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .mypy_cache -exec rm -rf {} + 2>/dev/null || true
	rm -rf backend/dist backend/build frontend/.next frontend/out
