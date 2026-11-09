# AI First Events

A small events + RSVP app for a hands-on workshop: you'll add features to it with an AI coding agent.

- Browse upcoming events, RSVP with name + email, get a confirmation email.
- Full events show **Full**; duplicate emails and past events are rejected with a clear message.
- `/admin` lists every event with its RSVP count.

Stack: Next.js 16 + Tailwind · Fastify · Postgres 16 + Drizzle · Mailpit · pnpm workspaces ·
Vitest + Playwright. See [AGENTS.md](AGENTS.md) for the full map and commands.

## Prerequisites

- **Docker Desktop** (or Docker Engine + Compose v2), with at least 4 GB of memory allocated
- **Node 22** (`nvm use` reads `.nvmrc`) and **pnpm 9**: `corepack enable pnpm`
- An AI coding agent (e.g. Claude Code) for the workshop exercises

## Quick start

```bash
git clone <this repo> aifirst-events && cd aifirst-events
docker compose up --build
open http://localhost:3000
```

That's it: the API container migrates the database and loads seed data on first start.
Emails land in Mailpit at http://localhost:8025.

### Developing (hot reload)

```bash
make install      # pnpm install + Playwright's Chromium
make dev          # postgres + mailpit in Docker; api + web on your machine
```

Stop `docker compose up` first: `make dev` needs ports 3000 and 4000 free.

| URL                         | What                         |
| --------------------------- | ---------------------------- |
| http://localhost:3000       | Web app                      |
| http://localhost:3000/admin | Admin view                   |
| http://localhost:4000       | API (`/health`, `/events` …) |
| http://localhost:8025       | Mailpit inbox                |

### Tests

```bash
make test   # lint + typecheck + unit + integration (starts postgres + mailpit if needed)
make e2e    # builds and starts the stack in Docker, then runs Playwright
```

## Workshop

Pick a feature card from [docs/goals](docs/goals/README.md) and build it with your agent.

## Troubleshooting

**Port already in use** (`bind: address already in use` for 3000, 4000, 5432, 8025 or 1025)

```bash
lsof -nP -iTCP:5432 -sTCP:LISTEN   # find what is using the port
```

- A local Postgres often holds 5432: stop it (`brew services stop postgresql`) or quit Postgres.app.
- Don't run `make dev` and `docker compose up` at the same time; `docker compose down` first.
- A leftover `pnpm dev` may still hold 3000/4000: stop it with Ctrl+C or kill the PID from `lsof`.

**Docker runs out of memory / builds get killed** (`exit code 137`, `Killed`, very slow builds)

Docker Desktop → Settings → Resources → Memory: give it at least 4 GB, then `docker compose up --build` again.
Free space with `docker system prune` if the disk is full.

**The app shows "Something went wrong"**: the web app can't reach the API. Check `docker compose ps`
(all services should be `healthy`) and `docker compose logs api`.

**Start over with fresh data**: `make reset` (dev DB), or `docker compose down -v && docker compose up --build`
to throw away the Docker database volume entirely.

**`pnpm: command not found`**: run `corepack enable pnpm` (ships with Node 22).
