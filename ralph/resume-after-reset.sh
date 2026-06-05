#!/usr/bin/env bash
# Wait until the Anthropic usage-limit reset window passes, then run the AFK Ralph
# loop for the remaining slices. Safe to launch in the background:
#   ./ralph/resume-after-reset.sh "2026-06-05 05:35" 12 &
#
# Arg 1: target local datetime to start (default: today 05:35)
# Arg 2: AFK iteration cap (default 12)
set -uo pipefail
cd "$(dirname "$0")/.."

TARGET_STR="${1:-$(date +%Y-%m-%d) 05:35}"
CAP="${2:-12}"

# BSD/macOS date -j -f to parse the target into epoch seconds.
target=$(date -j -f "%Y-%m-%d %H:%M" "$TARGET_STR" +%s)
echo "[resume] $(date) — waiting until $TARGET_STR before launching AFK loop"

until [ "$(date +%s)" -ge "$target" ]; do
  sleep 300
done

echo "[resume] $(date) — reset window passed, launching AFK loop (cap $CAP)"
exec ./ralph/afk-ralph.sh "$CAP"
