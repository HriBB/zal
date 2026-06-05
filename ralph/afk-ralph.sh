#!/usr/bin/env bash
# AFK Ralph loop for the ZAL website build. Runs up to N iterations, each a fresh
# `claude` context with the /tdd skill loaded, picking the next dependency-unblocked
# issue. Stops early when an iteration prints <promise>COMPLETE</promise>.
#
# Usage: ./ralph/afk-ralph.sh [N]   (default N=16)
set -uo pipefail
cd "$(dirname "$0")/.."

N="${1:-16}"
mkdir -p ralph

for ((i=1; i<=N; i++)); do
  ts=$(date +%Y%m%d-%H%M%S)
  log="ralph/iteration-$ts.log"
  echo "===== Ralph AFK iteration $i/$N -> $log ====="

  claude -p "/tdd $(cat ralph/PROMPT.md)" \
    --model claude-sonnet-4-6 \
    --dangerously-skip-permissions \
    --add-dir /Users/bojan/www/zal \
    --add-dir /Users/bojan/www/letece-kele/website \
    --add-dir /Users/bojan/www/mojterapevt/website \
    --add-dir /Users/bojan/www/slackalien/studio-website \
    2>&1 | tee "$log"

  if grep -q '<promise>COMPLETE</promise>' "$log"; then
    echo "===== Ralph reports COMPLETE after $i iteration(s). Stopping. ====="
    break
  fi

  # Anthropic usage/session limit — stop instead of burning the remaining cap on
  # instant-fail iterations. Re-run once quota returns.
  if grep -qi 'hit your session limit\|usage limit\|rate limit' "$log"; then
    echo "===== Usage limit hit on iteration $i. Stopping; resume after the reset window. ====="
    break
  fi
done

echo "===== AFK loop finished. Open ready-for-agent issues remaining: ====="
gh issue list --state open --label ready-for-agent --json number,title --jq '.[] | "#\(.number) \(.title)"' || true
