# AI First Events: common tasks. Run `make help` to list them.
SHELL := /bin/bash
.DEFAULT_GOAL := help

DATABASE_URL ?= postgres://aifirst:aifirst@localhost:5432/aifirst
export DATABASE_URL

.PHONY: help install dev up down test lint typecheck unit integration e2e seed reset logs

help: ## List available targets
	@grep -E '^[a-z-]+:.*?## ' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies and the Playwright browser
	pnpm install
	pnpm --filter @aifirst/e2e install-browsers

dev: ## Postgres + Mailpit in Docker, api + web on the host with hot reload
	@test -f .env || cp .env.example .env
	docker compose up -d --wait postgres mailpit
	pnpm db:migrate
	pnpm --filter @aifirst/db seed:if-empty
	pnpm dev

up: ## Whole stack in Docker (same as `docker compose up --build`)
	docker compose up --build

down: ## Stop all containers (keeps the database volume)
	docker compose down

test: lint typecheck unit integration ## Lint, typecheck, unit and integration tests

lint: ## ESLint + Prettier check
	pnpm lint
	pnpm format:check

typecheck: ## TypeScript in every package
	pnpm typecheck

unit: ## Vitest unit tests (no services needed)
	pnpm test:unit

integration: ## Vitest integration tests against Postgres (aifirst_test) + Mailpit
	docker compose up -d --wait postgres mailpit
	pnpm test:integration

e2e: ## Build + start the full stack in Docker, then run Playwright
	docker compose up -d --build --wait
	pnpm test:e2e

seed: ## Add seed data to the dev database
	pnpm db:seed

reset: ## Drop the dev database, migrate, and seed
	pnpm db:reset

logs: ## Tail container logs
	docker compose logs -f
