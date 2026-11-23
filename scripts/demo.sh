#!/usr/bin/env bash
# Workshop demo helper: get the repo, database and app into a clean state between demos.
#
#   ./scripts/demo.sh setup <demo>   switch to a demo branch and prepare everything
#   ./scripts/demo.sh reset          start the current demo over (discards the agent's changes)
#   ./scripts/demo.sh fallback       switch the current demo to its -fixed branch
#   ./scripts/demo.sh finish         back to main with the normal Docker stack
#   ./scripts/demo.sh stop           stop every `make dev` from this repo
#   ./scripts/demo.sh status         show branch, ports and containers
#
# Demos: cancel, calendar, mutation, race, privacy, sqli
set -euo pipefail

# Run from a temporary copy: `git switch` may replace this file while it runs.
if [[ -z "${DEMO_SH_COPY:-}" ]]; then
  copy="$(mktemp -t demo-sh)"
  cp "$0" "$copy"
  DEMO_SH_COPY=1 DEMO_SH_ROOT="$(cd "$(dirname "$0")/.." && pwd)" exec bash "$copy" "$@"
fi
cd "$DEMO_SH_ROOT"
export DATABASE_URL="${DATABASE_URL:-postgres://aifirst:aifirst@localhost:5432/aifirst}"

# demo name -> "branch mode". mode: docker = whole stack in Docker, dev = `make dev` hot reload.
demo_info() {
  case "$1" in
    cancel) echo "demo/cancel-rsvp docker" ;;
    calendar) echo "demo/add-to-calendar docker" ;;
    mutation) echo "demo/mutation-testing dev" ;;
    race) echo "demo/race-condition dev" ;;
    privacy) echo "demo/privacy-leak dev" ;;
    sqli) echo "demo/sql-injection dev" ;;
    *) return 1 ;;
  esac
}

# Which demo is the current branch? (the -fixed fallback counts as the same demo)
current_demo() {
  local branch
  branch="$(git branch --show-current)"
  branch="${branch%-fixed}"
  for d in cancel calendar mutation race privacy sqli; do
    [[ "$(demo_info "$d" | cut -d' ' -f1)" == "$branch" ]] && { echo "$d"; return 0; }
  done
  return 1
}

say() { printf '\n\033[1;36m▶ %s\033[0m\n' "$*"; }
die() { printf '\n\033[1;31m✖ %s\033[0m\n' "$*" >&2; exit 1; }

# Stop every `make dev` started in this repo (from any terminal or Claude session),
# plus any leftover dev server still holding port 3000 or 4000.
stop_dev() {
  local root pid cwd found=""
  root="$(pwd -P)"
  for pid in $(pgrep -f 'make dev|pnpm dev|pnpm --parallel|tsx.*watch|next dev|next-server' || true); do
    # Skip shells that merely mention `make dev` in their command line.
    [[ "$(ps -o comm= -p "$pid" 2>/dev/null)" =~ (^|/)(ba|z|da)?sh$ ]] && continue
    cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | sed -n 's/^n//p')"
    [[ "$cwd" == "$root" || "$cwd" == "$root"/* ]] && found="$found $pid"
  done
  for pid in $(lsof -tiTCP:3000 -tiTCP:4000 -sTCP:LISTEN 2>/dev/null || true); do
    ps -o command= -p "$pid" | grep -q aifirst-events && found="$found $pid"
  done
  if [[ -z "${found// /}" ]]; then
    echo "  none running"
    return 0
  fi
  echo "  stopping:$found"
  kill $found 2>/dev/null || true
  for _ in 1 2 3 4 5 6 7 8 9 10; do
    sleep 1
    lsof -tiTCP:3000 -tiTCP:4000 -sTCP:LISTEN 2>/dev/null | while read -r pid; do
      ps -o command= -p "$pid" | grep -q aifirst-events && echo busy
    done | grep -q busy || return 0
  done
  die "Something from this repo still holds port 3000 or 4000. Check: lsof -iTCP:3000 -iTCP:4000 -sTCP:LISTEN"
}

# Throw away whatever the agent changed or created in the app code, after asking.
discard_changes() {
  local changes
  changes="$(git status --porcelain -- apps packages e2e)"
  [[ -z "$changes" ]] && return 0
  echo "  These changes in apps/, packages/ and e2e/ will be discarded:"
  echo "$changes" | sed 's/^/    /'
  if [[ "${DEMO_YES:-}" != 1 ]]; then
    read -r -p "  Discard them? [y/N] " answer
    [[ "$answer" == [yY]* ]] || die "Stopped. Nothing was changed."
  fi
  git restore --staged --worktree -- apps packages e2e
  git clean -fdq -- apps packages e2e
}

prepare_stack() {
  local mode="$1"
  if [[ "$mode" == docker ]]; then
    say "Building and starting the whole stack in Docker (takes a minute or two)"
    docker compose up -d --build --wait
  else
    say "Starting Postgres + Mailpit, stopping the Docker app (you run make dev)"
    docker compose up -d --wait postgres mailpit
    docker compose stop api web >/dev/null 2>&1 || true
  fi
  say "Loading fresh seed data and emptying the Mailpit inbox"
  make reset
  curl -fsS -X DELETE http://localhost:8025/api/v1/messages >/dev/null
}

next_steps() {
  local mode="$1"
  say "Ready on $(git branch --show-current)"
  if [[ "$mode" == dev ]]; then
    echo "  1. In another terminal tab:  make dev"
    echo "  2. Open a NEW Claude session (so it picks up the slow-motion browser)."
  else
    echo "  App: http://localhost:3000   Mailpit: http://localhost:8025"
    echo "  Open a NEW Claude session."
  fi
}

go_to() {
  local branch="$1" mode="$2" quiet="${3:-}" elsewhere
  # Check before touching anything: git can't switch to a branch checked out in another worktree.
  elsewhere="$(git worktree list --porcelain | awk -v ref="refs/heads/$branch" -v here="$(pwd -P)" \
    '/^worktree /{wt=substr($0,10)} $0=="branch " ref && wt!=here {print wt}')"
  [[ -z "$elsewhere" ]] || die "$branch is checked out in another worktree: $elsewhere
  Switch that worktree to another branch (or remove it with: git worktree remove $elsewhere), then retry."
  say "Cleaning up and switching to $branch"
  discard_changes # asks first, before anything else is touched
  say "Stopping dev servers from this repo"
  stop_dev
  rm -rf apps/api/reports
  git switch -q "$branch" || die "Could not switch to $branch."
  prepare_stack "$mode"
  [[ -n "$quiet" ]] || next_steps "$mode"
}

cmd="${1:-}"
case "$cmd" in
  setup)
    demo="${2:-}"
    info="$(demo_info "$demo")" || die "Usage: ./scripts/demo.sh setup <cancel|calendar|mutation|race|privacy|sqli>"
    read -r branch mode <<<"$info"
    go_to "$branch" "$mode"
    ;;
  reset)
    demo="$(current_demo)" || die "Not on a demo branch. Use: ./scripts/demo.sh setup <demo>"
    read -r _ mode <<<"$(demo_info "$demo")"
    go_to "$(git branch --show-current)" "$mode"
    ;;
  fallback)
    demo="$(current_demo)" || die "Not on a demo branch."
    read -r branch mode <<<"$(demo_info "$demo")"
    go_to "$branch-fixed" "$mode"
    ;;
  finish)
    go_to main docker quiet
    say "Back on main with the normal Docker stack"
    ;;
  stop)
    say "Stopping dev servers from this repo"
    stop_dev
    ;;
  status)
    echo "Branch:     $(git branch --show-current)"
    echo "Demo:       $(current_demo || echo '-')"
    echo "Ports:";  lsof -iTCP:3000 -iTCP:4000 -sTCP:LISTEN -P 2>/dev/null | awk 'NR>1{print "  "$1, $2, $9}' || true
    echo "Containers:"; docker compose ps --format '{{.Name}} {{.Status}}' | sed 's/^/  /'
    echo "Changes:";   git status --short -- apps packages e2e | sed 's/^/  /'
    ;;
  *)
    sed -n '2,11p' "$0" | sed 's/^# \{0,1\}//'
    exit 1
    ;;
esac
