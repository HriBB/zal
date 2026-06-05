#!/usr/bin/env bash
# One Ralph iteration (HITL). Implements the next ready issue end-to-end with the
# /tdd skill loaded, then STOPS so a human can review before the AFK loop continues.
#
# Usage: ./ralph/ralph-once.sh
set -uo pipefail
cd "$(dirname "$0")/.."

mkdir -p ralph
ts=$(date +%Y%m%d-%H%M%S)
log="ralph/iteration-$ts.log"

echo "===== Ralph (HITL) single iteration -> $log ====="
claude -p "/tdd $(cat ralph/PROMPT.md)" \
  --dangerously-skip-permissions \
  --add-dir /Users/bojan/www/zal \
  --add-dir /Users/bojan/www/letece-kele/website \
  --add-dir /Users/bojan/www/mojterapevt/website \
  --add-dir /Users/bojan/www/slackalien/studio-website \
  2>&1 | tee "$log"

echo "===== Iteration done. Review the commit + issue before running afk-ralph.sh ====="
