#!/usr/bin/env bash
# =============================================================================
# chroniq.cc — Release Script
# =============================================================================
# Squash local dev commits into one, push dev, merge to main, tag, and push.
#
# Usage:
#   bin/release.sh [OPTIONS]
#
# OPTIONS:
#   -m, --message <msg>   Commit message for the squashed commit (required
#                         unless --no-squash; used as the merge commit message
#                         on main too)
#   --squash <n>          Squash the last N commits (default: all commits since
#                         dev branched from main)
#   --no-squash           Skip squashing — push dev commits as-is
#   --tag-message <msg>   Annotation for the git tag (default: same as --message)
#   --dry-run             Print all commands without executing
#   -h, --help            Show this help message
#
# Tag naming convention (auto-incremented):
#   v{major}.{minor}.{patch}.{build}   e.g. v1.0.0.6 → v1.0.0.7
#   The last segment is the build counter. Major/minor/patch never change
#   automatically — edit the script to bump them for a breaking release.
#
# Remote:
#   Uses git@github.com-whereq:whereq/chroniq.cc.git via the SSH config
#   host alias 'github.com-whereq' (identity: ~/.ssh/wq_gh).
#
# Typical flow:
#   1. Develop on dev, accumulate commits
#   2. bin/release.sh --message "Add calendar sync feature"
#      → squashes dev commits, pushes dev, merges to main, tags v1.0.0.N
#   3. On prod server: bin/deploy.sh
#
# Examples:
#   bin/release.sh -m "Add calendar sync feature"
#   bin/release.sh -m "Fix event overlap rendering" --squash 3
#   bin/release.sh --no-squash -m "Hotfix: correct timezone handling"
#   bin/release.sh -m "Add recurrence engine" --tag-message "Recurrence v1"
#   bin/release.sh -m "WIP checkpoint" --dry-run
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
# Paths & remote
# -----------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
REMOTE_URL="git@github.com-whereq:whereq/chroniq.cc.git"

# -----------------------------------------------------------------------------
# Defaults
# -----------------------------------------------------------------------------
COMMIT_MSG=""
TAG_MSG=""
SQUASH_N=""          # empty = all since merge-base; numeric = last N
DO_SQUASH=true
DRY_RUN=false
DEV_BRANCH="dev"
MAIN_BRANCH="main"
STEP=0
START_TIME=$(date +%s)

declare -a STEP_NAMES=()
declare -a STEP_RESULTS=()

# -----------------------------------------------------------------------------
# Helpers
# -----------------------------------------------------------------------------
usage() {
    sed -n '3,47p' "$0" | sed 's/^# \?//'
    exit 0
}

info()    { echo -e "${CYAN}▶${NC} $*"; }
success() { echo -e "${GREEN}✔${NC} $*"; }
warn()    { echo -e "${YELLOW}⚠${NC}  $*"; }
error()   { echo -e "${RED}✖${NC} $*" >&2; }
dim()     { echo -e "${DIM}  $*${NC}"; }

step() {
    STEP=$((STEP + 1))
    echo ""
    echo -e "${BOLD}${CYAN}━━━ Step ${STEP}: $*${NC}"
    STEP_NAMES+=("$*")
}

record_result() { STEP_RESULTS+=("$1"); }

run() {
    if [[ "$DRY_RUN" == true ]]; then
        echo -e "  ${DIM}[dry-run]${NC} ${BOLD}$*${NC}"
    else
        "$@"
    fi
}

elapsed_time() {
    local secs=$(( $(date +%s) - START_TIME ))
    printf '%dm%02ds' $(( secs / 60 )) $(( secs % 60 ))
}

# Auto-compute the next tag by incrementing the build counter
next_tag() {
    local last
    last=$(git -C "$PROJECT_ROOT" tag --sort=-version:refname \
        | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$' \
        | head -1 || true)

    if [[ -z "$last" ]]; then
        echo "v1.0.0.1"
        return
    fi

    local body="${last#v}"           # "1.0.0.6"
    local prefix="${body%.*}"        # "1.0.0"
    local build="${body##*.}"        # "6"
    echo "v${prefix}.$((build + 1))"
}

# -----------------------------------------------------------------------------
# Parse arguments
# -----------------------------------------------------------------------------
parse_args() {
    while [[ $# -gt 0 ]]; do
        case "$1" in
            -m|--message)
                [[ -n "${2:-}" ]] || { error "--message requires a value"; exit 1; }
                COMMIT_MSG="$2"; shift 2 ;;
            --squash)
                [[ "${2:-}" =~ ^[0-9]+$ ]] || { error "--squash requires a number"; exit 1; }
                SQUASH_N="$2"; shift 2 ;;
            --no-squash)
                DO_SQUASH=false; shift ;;
            --tag-message)
                [[ -n "${2:-}" ]] || { error "--tag-message requires a value"; exit 1; }
                TAG_MSG="$2"; shift 2 ;;
            --dry-run)
                DRY_RUN=true; shift ;;
            -h|--help)
                usage ;;
            *)
                error "Unknown argument: $1"
                echo "Run 'bin/release.sh --help' for usage."
                exit 1 ;;
        esac
    done

    if [[ "$DO_SQUASH" == true && -z "$COMMIT_MSG" ]]; then
        error "--message is required when squashing commits."
        echo "Use: bin/release.sh -m \"Your release summary\""
        exit 1
    fi

    if [[ "$DO_SQUASH" == false && -z "$COMMIT_MSG" ]]; then
        error "--message is required (used as the merge commit message on main)."
        exit 1
    fi

    [[ -z "$TAG_MSG" ]] && TAG_MSG="$COMMIT_MSG"
}

# -----------------------------------------------------------------------------
# Pre-flight checks
# -----------------------------------------------------------------------------
preflight() {
    local tag
    tag=$(next_tag)

    info "chroniq.cc release — ${DEV_BRANCH} → ${MAIN_BRANCH} | next tag: ${BOLD}${tag}${NC} | dry-run: ${BOLD}${DRY_RUN}${NC}"
    dim "Remote: ${REMOTE_URL}"
    echo ""

    if [[ "$DRY_RUN" == false ]]; then
        if ! git -C "$PROJECT_ROOT" rev-parse --git-dir &>/dev/null; then
            error "Not a git repository: ${PROJECT_ROOT}"
            exit 1
        fi

        local current_branch
        current_branch=$(git -C "$PROJECT_ROOT" rev-parse --abbrev-ref HEAD)
        if [[ "$current_branch" != "$DEV_BRANCH" ]]; then
            error "Must be on '${DEV_BRANCH}' branch. Currently on: '${current_branch}'"
            exit 1
        fi

        if ! git -C "$PROJECT_ROOT" diff --quiet || \
           ! git -C "$PROJECT_ROOT" diff --cached --quiet; then
            error "Uncommitted changes detected. Commit or stash them first."
            git -C "$PROJECT_ROOT" status --short
            exit 1
        fi

        # Verify the remote uses the correct SSH host alias
        local actual_remote
        actual_remote=$(git -C "$PROJECT_ROOT" remote get-url origin 2>/dev/null || true)
        if [[ "$actual_remote" != "$REMOTE_URL" ]]; then
            warn "origin remote is '${actual_remote}', expected '${REMOTE_URL}'"
            warn "Run: git remote set-url origin ${REMOTE_URL}"
        fi

        success "On branch ${DEV_BRANCH}, working tree clean"
    fi
}

# -----------------------------------------------------------------------------
# Step: Squash commits
# -----------------------------------------------------------------------------
do_squash() {
    if [[ "$DO_SQUASH" == false ]]; then
        warn "Skipping squash (--no-squash)"
        record_result "skip"
        return
    fi

    local base commit_count

    if [[ -n "$SQUASH_N" ]]; then
        step "Squash last ${SQUASH_N} commits into one"
        base="HEAD~${SQUASH_N}"
        if [[ "$DRY_RUN" == false ]]; then
            commit_count="$SQUASH_N"
        fi
    else
        step "Squash all commits since branched from ${MAIN_BRANCH}"
        if [[ "$DRY_RUN" == false ]]; then
            base=$(git -C "$PROJECT_ROOT" merge-base "$MAIN_BRANCH" HEAD)
            commit_count=$(git -C "$PROJECT_ROOT" rev-list --count "${base}..HEAD")
            dim "Merge-base: ${base:0:10}  |  Squashing ${commit_count} commit(s)"

            if [[ "$commit_count" -eq 0 ]]; then
                warn "No commits to squash — ${DEV_BRANCH} is even with ${MAIN_BRANCH}."
                record_result "skip"
                return
            fi

            echo ""
            git -C "$PROJECT_ROOT" log --oneline "${base}..HEAD" | sed 's/^/  /'
            echo ""
        else
            base="<merge-base>"
            dim "[dry-run] would compute merge-base with ${MAIN_BRANCH}"
        fi
    fi

    dim "git reset --soft ${base}"
    dim "git commit -m \"${COMMIT_MSG}\""

    run git -C "$PROJECT_ROOT" reset --soft "$base"
    run git -C "$PROJECT_ROOT" commit -m "$COMMIT_MSG"

    if [[ "$DRY_RUN" == false ]]; then
        local new_sha
        new_sha=$(git -C "$PROJECT_ROOT" log -1 --oneline)
        success "Squashed → ${new_sha}"
    fi

    record_result "ok"
}

# -----------------------------------------------------------------------------
# Step: Push dev to remote
# -----------------------------------------------------------------------------
do_push_dev() {
    step "Push ${DEV_BRANCH} to origin"

    if [[ "$DO_SQUASH" == true ]]; then
        dim "History was rewritten — using --force-with-lease"
        run git -C "$PROJECT_ROOT" push origin "$DEV_BRANCH" --force-with-lease
    else
        run git -C "$PROJECT_ROOT" push origin "$DEV_BRANCH"
    fi

    record_result "ok"
}

# -----------------------------------------------------------------------------
# Step: Merge dev into main
# -----------------------------------------------------------------------------
do_merge_to_main() {
    step "Merge ${DEV_BRANCH} → ${MAIN_BRANCH}"

    run git -C "$PROJECT_ROOT" checkout "$MAIN_BRANCH"
    run git -C "$PROJECT_ROOT" pull origin "$MAIN_BRANCH"
    run git -C "$PROJECT_ROOT" merge --no-ff "$DEV_BRANCH" -m "Merge ${DEV_BRANCH}: ${COMMIT_MSG}"

    if [[ "$DRY_RUN" == false ]]; then
        local merge_sha
        merge_sha=$(git -C "$PROJECT_ROOT" log -1 --oneline)
        success "Merged → ${merge_sha}"
    fi

    record_result "ok"
}

# -----------------------------------------------------------------------------
# Step: Tag main
# -----------------------------------------------------------------------------
do_tag() {
    local tag
    tag=$(next_tag)

    step "Tag ${MAIN_BRANCH} as ${tag}"
    dim "Message: ${TAG_MSG}"

    run git -C "$PROJECT_ROOT" tag -a "$tag" -m "$TAG_MSG"

    if [[ "$DRY_RUN" == false ]]; then
        success "Tagged: ${tag}"
    fi

    record_result "ok"
}

# -----------------------------------------------------------------------------
# Step: Push main + tags
# -----------------------------------------------------------------------------
do_push_main() {
    step "Push ${MAIN_BRANCH} + tags to origin"

    run git -C "$PROJECT_ROOT" push origin "$MAIN_BRANCH"
    run git -C "$PROJECT_ROOT" push origin --tags

    record_result "ok"
}

# -----------------------------------------------------------------------------
# Step: Switch back to dev
# -----------------------------------------------------------------------------
do_return_to_dev() {
    step "Switch back to ${DEV_BRANCH}"

    run git -C "$PROJECT_ROOT" checkout "$DEV_BRANCH"
    success "Back on ${DEV_BRANCH}"

    record_result "ok"
}

# -----------------------------------------------------------------------------
# Summary
# -----------------------------------------------------------------------------
print_summary() {
    echo ""
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD} Release Summary — chroniq.cc${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    printf "%-6s  %-42s  %s\n" "Step" "Action" "Result"
    echo  "──────  ──────────────────────────────────────────  ──────"

    local i
    for i in "${!STEP_NAMES[@]}"; do
        local num=$((i + 1))
        local result="${STEP_RESULTS[$i]:-?}"
        local icon
        case "$result" in
            ok)   icon="${GREEN}✔ ok${NC}" ;;
            skip) icon="${YELLOW}– skip${NC}" ;;
            fail) icon="${RED}✖ FAIL${NC}" ;;
            *)    icon="${DIM}?${NC}" ;;
        esac
        printf "%-6s  %-42s  " "$num" "${STEP_NAMES[$i]:0:42}"
        echo -e "$icon"
    done

    if [[ "$DRY_RUN" == false ]]; then
        echo ""
        echo -e "${BOLD}Recent tags:${NC}"
        git -C "$PROJECT_ROOT" tag --sort=-version:refname | head -5 | sed 's/^/  /'
        echo ""
        echo -e "${BOLD}Branch tips:${NC}"
        git -C "$PROJECT_ROOT" log --oneline -1 "$MAIN_BRANCH" | sed "s/^/  main:  /"
        git -C "$PROJECT_ROOT" log --oneline -1 "$DEV_BRANCH"  | sed "s/^/  dev:   /"
    fi

    echo ""
    echo -e "  Message: ${BOLD}${COMMIT_MSG}${NC}   Elapsed: ${BOLD}$(elapsed_time)${NC}"
    echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BOLD}Next step — deploy to production:${NC}"
    echo -e "  ${DIM}ssh whereq@chroniq.cc${NC}"
    echo -e "  ${DIM}cd /home/whereq/github/chroniq.cc${NC}"
    echo -e "  ${DIM}bin/deploy.sh${NC}"
}

trap 'echo ""; error "Release interrupted."; print_summary; exit 1' ERR

# -----------------------------------------------------------------------------
# Main
# -----------------------------------------------------------------------------
main() {
    parse_args "$@"
    preflight
    do_squash
    do_push_dev
    do_merge_to_main
    do_tag
    do_push_main
    do_return_to_dev
    print_summary
    echo -e "${GREEN}${BOLD}Release complete.${NC}"
}

main "$@"
