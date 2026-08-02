#!/usr/bin/env bash
# =============================================================================
# chroniq.cc — Production Deployment Script (run on the Raspberry Pi)
# =============================================================================
# Usage:
#   bin/deploy.sh [MODE] [OPTIONS]
#
# MODES (default: full):
#   full        Rebuild all containers: api, scheduler, frontend
#   frontend    Rebuild frontend only — fastest, no backend downtime
#   backend     Rebuild api + scheduler; frontend nginx reloaded for new api IP
#   api         Rebuild api only — scheduler untouched; frontend nginx reloaded
#   scheduler   Rebuild scheduler only (--no-deps) — api/frontend untouched
#
# OPTIONS:
#   --branch <name>   Git branch to pull (default: main)
#   --migrate         Explicitly run 'alembic upgrade head' after api is up.
#                     (The api container already runs migrations on start, so
#                     this is the "deploy with DB changes" mode — it waits,
#                     re-applies idempotently, and reports the schema version.)
#   --no-pull         Skip git pull (deploy current local code as-is)
#   --dry-run         Print all commands without executing anything
#   -h, --help        Show this help message
#
# Examples:
#   bin/deploy.sh                          # full deploy from main
#   bin/deploy.sh full --migrate           # full deploy + verify DB migration
#   bin/deploy.sh frontend                 # frontend only, no backend downtime
#   bin/deploy.sh api --migrate            # API only — scheduler kept running
#   bin/deploy.sh backend --migrate        # backend + migration, skip frontend rebuild
#   bin/deploy.sh full --branch dev        # deploy from dev branch (staging test)
#   bin/deploy.sh full --no-pull --migrate # run migration against current code
#   bin/deploy.sh full --dry-run           # preview what would run
# =============================================================================
set -euo pipefail

# -----------------------------------------------------------------------------
# Colours
# -----------------------------------------------------------------------------
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# -----------------------------------------------------------------------------
# Paths (resolve from script location so it works from any cwd)
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
COMPOSE_FILE="${PROJECT_ROOT}/docker/docker-compose.yml"
DB_CONTAINER="whereq-db"
API_CONTAINER="chroniq-api"
SCHEDULER_CONTAINER="chroniq-scheduler"
FRONTEND_CONTAINER="chroniq-frontend"
# chroniq owns the 'chroniq' database inside the shared whereq-db. The DB user
# is the shared Postgres owner (defaults match bin/dev.sh / docker-compose).
DB_USER="${POSTGRES_USER:-flowdesk}"
CHRONIQ_DB="${CHRONIQ_DB:-chroniq}"
# End-to-end proxy path the browser actually uses: cloudflared → frontend
# nginx → api. Verifying this (not just the api container directly) is what
# catches a stale nginx upstream after the api container is recreated.
# The published host port is detected from the container at check time
# (prod publishes 8080); FRONTEND_PORT is only the fallback.
FRONTEND_PORT="${FRONTEND_PORT:-8080}"

# Return the host port the frontend container publishes container-port 80 on,
# or empty if it can't be determined.
detect_frontend_port() {
    docker inspect "$FRONTEND_CONTAINER" \
        --format '{{range $p, $c := .NetworkSettings.Ports}}{{if eq $p "80/tcp"}}{{(index $c 0).HostPort}}{{end}}{{end}}' \
        2>/dev/null
}

# -----------------------------------------------------------------------------
# Defaults
# -----------------------------------------------------------------------------
MODE="full"
BRANCH="main"
DO_PULL=true
DO_MIGRATE=false
DRY_RUN=false
STEP=0
START_TIME=$(date +%s)

# Collect per-step results for the final summary
declare -a STEP_NAMES=()
declare -a STEP_RESULTS=()

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
usage() {
    sed -n '3,37p' "$0" | sed 's/^# \?//'
    exit 0
}

info()    { echo -e "${CYAN}▶${NC} $*"; }
success() { echo -e "${GREEN}✔${NC} $*"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $*"; }
error()   { echo -e "${RED}✖${NC} $*" >&2; }
dim()     { echo -e "${DIM}  $*${NC}"; }

step() {
    STEP=$((STEP + 1))
    local label="$*"
    echo ""
    echo -e "${BOLD}${CYAN}━━━ Step ${STEP}: ${label}${NC}"
    STEP_NAMES+=("$label")
}

record_result() {
    # Call after a step: record_result ok|skip|fail
    STEP_RESULTS+=("$1")
}

# Execute or print (dry-run mode)
run() {
    if [[ "$DRY_RUN" == true ]]; then
        echo -e "  ${DIM}[dry-run]${NC} ${BOLD}$*${NC}"
    else
        "$@"
    fi
}

# Poll a container's health status until healthy or timeout. Containers without
# a healthcheck report "running" as soon as they're up.
wait_healthy() {
    local container="$1"
    local max_wait="${2:-120}"
    local elapsed=0

    if [[ "$DRY_RUN" == true ]]; then
        dim "[dry-run] would wait for ${container} to become healthy (max ${max_wait}s)"
        return 0
    fi

    echo -ne "  Waiting for ${BOLD}${container}${NC} to become healthy"
    while [[ $elapsed -lt $max_wait ]]; do
        local status
        status=$(docker inspect "$container" \
            --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
            2>/dev/null || echo "not_found")

        case "$status" in
            healthy|running)
                echo -e " ${GREEN}✔ ${status}${NC} (${elapsed}s)"
                return 0
                ;;
            not_found)
                echo -e " ${RED}✖ container not found${NC}"
                return 1
                ;;
        esac

        sleep 5
        elapsed=$((elapsed + 5))
        echo -ne "."
    done

    echo -e " ${RED}✖ timed out after ${max_wait}s${NC}"
    return 1
}

# Wait until the api answers its health endpoint through its own port (proof
# uvicorn booted AND the container's start-up `alembic upgrade head` finished).
wait_api_ready() {
    local max_wait="${1:-120}"
    local elapsed=0

    if [[ "$DRY_RUN" == true ]]; then
        dim "[dry-run] would wait for api /health inside ${API_CONTAINER}"
        return 0
    fi

    echo -ne "  Waiting for ${BOLD}api${NC} to answer /api/v1/health"
    while [[ $elapsed -lt $max_wait ]]; do
        if docker exec "$API_CONTAINER" \
            sh -c 'curl -fsS http://localhost:8000/api/v1/health >/dev/null 2>&1'; then
            echo -e " ${GREEN}✔ ready${NC} (${elapsed}s)"
            return 0
        fi
        sleep 3
        elapsed=$((elapsed + 3))
        echo -ne "."
    done

    echo -e " ${RED}✖ timed out after ${max_wait}s${NC}"
    return 1
}

# Re-resolve the api upstream in the frontend's nginx.
# When the api container is recreated it gets a new docker-network IP. nginx
# resolved `api` once at startup and caches it, so /api keeps proxying to the
# dead address (502 on every API call) until it re-resolves. A graceful
# `nginx -s reload` spawns new workers that re-resolve with zero downtime;
# fall back to a full container restart if the reload command fails.
# Returns 0 on success, non-zero otherwise.
_reload_frontend_nginx() {
    local fe_status
    fe_status=$(docker inspect "$FRONTEND_CONTAINER" \
        --format='{{.State.Status}}' 2>/dev/null || echo "not_found")
    if [[ "$fe_status" != "running" ]]; then
        warn "${FRONTEND_CONTAINER} is ${fe_status}; cannot reload nginx"
        return 1
    fi
    if docker exec "$FRONTEND_CONTAINER" nginx -s reload 2>/dev/null; then
        return 0
    fi
    warn "nginx reload failed — restarting ${FRONTEND_CONTAINER} as fallback"
    docker compose -f "$COMPOSE_FILE" restart frontend >/dev/null 2>&1
}

# Print elapsed time since START_TIME
elapsed_time() {
    local now
    now=$(date +%s)
    local secs=$(( now - START_TIME ))
    printf '%dm%02ds' $(( secs / 60 )) $(( secs % 60 ))
}

# -----------------------------------------------------------------------------
# Parse arguments
# -----------------------------------------------------------------------------
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            full|frontend|backend|api|scheduler)
                MODE="$1"
                shift
                ;;
            --branch)
                [[ -n "${2:-}" ]] || { error "--branch requires a value"; exit 1; }
                BRANCH="$2"
                shift 2
                ;;
            --migrate)
                DO_MIGRATE=true
                shift
                ;;
            --no-pull)
                DO_PULL=false
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            -h|--help)
                usage
                ;;
            *)
                error "Unknown argument: $1"
                echo "Run 'bin/deploy.sh --help' for usage."
                exit 1
                ;;
        esac
    done
}

# -----------------------------------------------------------------------------
# Pre-flight checks
# -----------------------------------------------------------------------------
preflight() {
    info "chroniq.cc deploy — mode=${BOLD}${MODE}${NC} branch=${BOLD}${BRANCH}${NC} migrate=${BOLD}${DO_MIGRATE}${NC} dry-run=${BOLD}${DRY_RUN}${NC}"
    echo ""

    if [[ "$DRY_RUN" == false ]]; then
        if ! docker info &>/dev/null; then
            error "Docker is not running or not accessible."
            exit 1
        fi

        # Guard against the shared-project footgun: every whereq app keeps its
        # compose file under a docker/ dir, so without an explicit name they all
        # default to project "docker" and a `down` here would tear down sibling
        # apps. The compose file declares `name: chroniq`; refuse to run if the
        # effective project is anything else.
        local proj
        proj=$(docker compose -f "$COMPOSE_FILE" config 2>/dev/null \
                | grep -E '^name:' | awk '{print $2}' | head -1)
        if [[ "$proj" != "chroniq" ]]; then
            error "Compose project resolved to '${proj:-<none>}', expected 'chroniq'."
            error "Refusing to run — this would risk sibling apps sharing project 'docker'."
            dim "Ensure docker/docker-compose.yml has a top-level 'name: chroniq' (and no COMPOSE_PROJECT_NAME override)."
            exit 1
        fi
        success "compose project = chroniq (isolated)"

        # DB must be up — it's shared infrastructure, never started by this script
        local db_status
        db_status=$(docker inspect "$DB_CONTAINER" \
            --format='{{.State.Status}}' 2>/dev/null || echo "not_found")

        if [[ "$db_status" != "running" ]]; then
            error "${DB_CONTAINER} is ${db_status}. Start the shared whereq-db first."
            exit 1
        fi
        success "${DB_CONTAINER} is running"

        # chroniq owns its own database inside the shared whereq-db — create on
        # first deploy if missing (never manages Postgres itself).
        if docker exec "$DB_CONTAINER" psql -U "$DB_USER" -tc \
            "SELECT 1 FROM pg_database WHERE datname='${CHRONIQ_DB}'" 2>/dev/null | grep -q 1; then
            success "database '${CHRONIQ_DB}' exists"
        else
            warn "database '${CHRONIQ_DB}' missing — creating it"
            docker exec "$DB_CONTAINER" createdb -U "$DB_USER" "$CHRONIQ_DB"
            success "database '${CHRONIQ_DB}' created"
        fi
    fi

    # Warn if deploying a non-main branch to a production context
    if [[ "$BRANCH" != "main" ]]; then
        warn "Deploying branch '${BRANCH}' (not main). Confirm this is intentional."
    fi
}

# -----------------------------------------------------------------------------
# Deployment steps
# -----------------------------------------------------------------------------

do_git_pull() {
    if [[ "$DO_PULL" == false ]]; then
        warn "Skipping git pull (--no-pull)"
        record_result "skip"
        return
    fi

    step "Pull latest code from ${BRANCH}"
    dim "cd ${PROJECT_ROOT} && git pull origin ${BRANCH}"

    run git -C "$PROJECT_ROOT" fetch origin
    run git -C "$PROJECT_ROOT" checkout "$BRANCH"
    run git -C "$PROJECT_ROOT" pull origin "$BRANCH"

    if [[ "$DRY_RUN" == false ]]; then
        local commit
        commit=$(git -C "$PROJECT_ROOT" log -1 --oneline)
        dim "HEAD → ${commit}"
    fi

    record_result "ok"
}

do_stop_all() {
    step "Stop application stack (DB stays running)"
    run docker compose -f "$COMPOSE_FILE" down
    record_result "ok"
}

do_stop_backend() {
    step "Stop backend containers (api + scheduler)"
    run docker compose -f "$COMPOSE_FILE" stop scheduler api
    run docker compose -f "$COMPOSE_FILE" rm -f scheduler api
    record_result "ok"
}

do_build_start_all() {
    step "Build and start all containers (api, scheduler, frontend)"
    run docker compose -f "$COMPOSE_FILE" up -d --build
    record_result "ok"
}

do_build_start_frontend() {
    step "Build and restart frontend container only"
    # --no-deps: do NOT touch the api container. Without it, compose brings up
    # frontend's `depends_on: api` and can recreate api (new IP, brief downtime)
    # during what is supposed to be a zero-backend-downtime frontend deploy.
    run docker compose -f "$COMPOSE_FILE" up -d --build --no-deps frontend
    record_result "ok"
}

do_build_start_backend() {
    step "Build and start api + scheduler"
    run docker compose -f "$COMPOSE_FILE" up -d --build api scheduler
    record_result "ok"
}

do_build_start_api() {
    step "Build and restart api only (scheduler kept running)"
    run docker compose -f "$COMPOSE_FILE" up -d --build --no-deps api
    record_result "ok"
}

do_build_start_scheduler() {
    step "Build and restart scheduler only"
    # --no-deps: do NOT touch api. Without it, compose brings up scheduler's
    # depends_on (api) and can recreate it (new IP → stale frontend nginx).
    run docker compose -f "$COMPOSE_FILE" up -d --build --no-deps scheduler
    record_result "ok"
}

do_reload_frontend_proxy() {
    step "Reload frontend nginx (re-resolve new api container IP)"

    if [[ "$DRY_RUN" == true ]]; then
        dim "[dry-run] docker exec ${FRONTEND_CONTAINER} nginx -s reload"
        record_result "skip"
        return
    fi

    if _reload_frontend_nginx; then
        success "frontend nginx reloaded — /api upstream re-resolved"
        record_result "ok"
    else
        record_result "fail"
    fi
}

do_verify_api_proxy() {
    step "Verify /api proxy path (frontend nginx → api)"

    local port url
    port="$(detect_frontend_port)"
    port="${port:-$FRONTEND_PORT}"
    url="http://localhost:${port}/api/v1/health"

    if [[ "$DRY_RUN" == true ]]; then
        dim "[dry-run] curl -fsS ${url}"
        record_result "skip"
        return
    fi

    local code
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" 2>/dev/null || echo "000")
    if [[ "$code" == "200" ]]; then
        success "/api reachable through frontend nginx — ${url} (HTTP 200)"
        record_result "ok"
        return
    fi

    # Most common cause is a stale nginx upstream after an api recreate —
    # reload and retry once so the deploy self-heals rather than just reporting.
    warn "/api proxy returned ${code} at ${url}; reloading frontend nginx and retrying once"
    _reload_frontend_nginx || true
    sleep 2
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" 2>/dev/null || echo "000")
    if [[ "$code" == "200" ]]; then
        success "/api recovered after nginx reload (HTTP 200)"
        record_result "ok"
    else
        error "/api proxy still failing (HTTP ${code}) at ${url}. Inspect: docker logs ${FRONTEND_CONTAINER}"
        record_result "fail"
    fi
}

do_migrate() {
    if [[ "$DO_MIGRATE" == false ]]; then
        record_result "skip"
        return
    fi

    step "Apply Alembic database migrations"

    # The api container already runs `alembic upgrade head` on start; wait for it
    # to be serving, then re-apply (idempotent) so --migrate is an explicit,
    # verifiable "deploy with DB changes" gate.
    wait_api_ready 120

    dim "docker exec ${API_CONTAINER} alembic upgrade head"
    run docker exec "$API_CONTAINER" alembic upgrade head

    if [[ "$DRY_RUN" == false ]]; then
        local version
        version=$(docker exec "$API_CONTAINER" alembic current 2>/dev/null || echo "unknown")
        dim "Migration state: ${version}"
    fi

    record_result "ok"
}

do_health_check() {
    step "Verify container health"

    if [[ "$DRY_RUN" == true ]]; then
        dim "[dry-run] would check health of all application containers"
        record_result "skip"
        return
    fi

    local all_ok=true

    # Check whatever mode was deployed
    local containers_to_check=()
    case "$MODE" in
        full)      containers_to_check=("$API_CONTAINER" "$SCHEDULER_CONTAINER" "$FRONTEND_CONTAINER") ;;
        backend)   containers_to_check=("$API_CONTAINER" "$SCHEDULER_CONTAINER") ;;
        frontend)  containers_to_check=("$FRONTEND_CONTAINER") ;;
        api)       containers_to_check=("$API_CONTAINER") ;;
        scheduler) containers_to_check=("$SCHEDULER_CONTAINER") ;;
    esac

    # Poll each until it settles (or times out) instead of reading status once —
    # otherwise a freshly-built container false-fails while still starting.
    for container in "${containers_to_check[@]}"; do
        wait_healthy "$container" 120 || all_ok=false
    done

    for container in "${containers_to_check[@]}"; do
        local status
        status=$(docker inspect "$container" \
            --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
            2>/dev/null || echo "not_found")

        if [[ "$status" == "healthy" || "$status" == "running" ]]; then
            success "${container}: ${status}"
        else
            error "${container}: ${status}"
            all_ok=false
        fi
    done

    [[ "$all_ok" == true ]] && record_result "ok" || record_result "fail"
}

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
print_summary() {
    echo ""
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD} Deployment Summary — chroniq.cc PROD${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    printf "%-6s  %-42s  %s\n" "Step" "Action" "Result"
    echo  "──────  ──────────────────────────────────────────  ──────"

    local i
    for i in "${!STEP_NAMES[@]}"; do
        local num=$((i + 1))
        local name="${STEP_NAMES[$i]}"
        local result="${STEP_RESULTS[$i]:-?}"
        local icon
        case "$result" in
            ok)   icon="${GREEN}✔ ok${NC}" ;;
            skip) icon="${YELLOW}– skip${NC}" ;;
            fail) icon="${RED}✖ FAIL${NC}" ;;
            *)    icon="${DIM}?${NC}" ;;
        esac
        printf "%-6s  %-42s  " "$num" "${name:0:42}"
        echo -e "$icon"
    done

    echo ""
    if [[ "$DRY_RUN" == false ]]; then
        echo -e "${BOLD}Container status:${NC}"
        docker compose -f "$COMPOSE_FILE" ps --format \
            "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null \
            | sed 's/^/  /'

        echo ""
        echo -e "${BOLD}DB migration version:${NC}"
        docker exec "$DB_CONTAINER" \
            psql -U "$DB_USER" -d "$CHRONIQ_DB" \
            -c "SELECT version_num FROM alembic_version;" \
            2>/dev/null | sed 's/^/  /' || echo "  (could not query)"
    fi

    echo ""
    echo -e "  Branch:   ${BOLD}${BRANCH}${NC}   Mode: ${BOLD}${MODE}${NC}   Elapsed: ${BOLD}$(elapsed_time)${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# On unexpected exit, still print what we have
trap 'echo ""; error "Deployment interrupted."; print_summary; exit 1' ERR

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
main() {
    parse_args "$@"
    preflight

    do_git_pull

    case "$MODE" in
        full)
            # 'down' removes every container, so the frontend is recreated
            # fresh and re-resolves api on its own — no explicit reload needed.
            do_stop_all
            do_build_start_all
            do_migrate
            do_health_check
            do_verify_api_proxy
            ;;
        frontend)
            do_build_start_frontend
            do_health_check
            do_verify_api_proxy
            ;;
        backend)
            do_stop_backend
            do_build_start_backend
            do_migrate
            do_health_check          # waits for the new api to be healthy
            do_reload_frontend_proxy # then point frontend nginx at its new IP
            do_verify_api_proxy
            ;;
        api)
            do_build_start_api
            do_migrate
            do_health_check
            do_reload_frontend_proxy
            do_verify_api_proxy
            ;;
        scheduler)
            # --no-deps leaves api/frontend untouched, so no nginx reload needed.
            # Still verify the /api proxy as a sanity check that nothing moved.
            do_build_start_scheduler
            do_health_check
            do_verify_api_proxy
            ;;
    esac

    print_summary
    echo -e "\n${GREEN}${BOLD}Deployment complete.${NC}"
}

main "$@"
