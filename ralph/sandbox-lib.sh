#!/usr/bin/env bash
# Docker-sandbox (sbx) helpers for Ralph loops. Source this; don't execute it.
#
# One-time host setup (already done on this machine):
#   brew install docker/tap/sbx && sbx login
#   gh auth token | sbx secret set -g github   # sbx proxy injects GitHub auth in
#                                              # flight; token never enters sandbox
#   (the anthropic oauth secret is created on the first interactive `sbx run claude`)
#
# ralph_sandbox_ensure NAME WORKSPACE [WORKSPACE...]
#   Creates sandbox NAME if missing and bootstraps it: pnpm, gh auth (proxy
#   placeholder), git identity, SSH→HTTPS remote rewrite, host user-skills
#   symlink (e.g. /tdd). Workspaces bind-mount at identical paths inside the
#   sandbox VM; append :ro for read-only. Idempotent — reattaching to an
#   existing sandbox skips create + bootstrap.

ralph_sandbox_ensure() {
  local name="$1"; shift

  if sbx ls 2>/dev/null | awk 'NR>1 {print $1}' | grep -qx "$name"; then
    return 0
  fi

  echo "[sbx] creating sandbox '$name'"
  sbx create --quiet --name "$name" claude "$@" || return 1

  local git_name git_email
  git_name="$(git config --get user.name)"
  git_email="$(git config --get user.email)"

  echo "[sbx] bootstrapping '$name' (pnpm, gh, git identity, skills)"
  sbx exec "$name" -- bash -lc "
    set -euo pipefail
    # Ubuntu's corepack shim is broken under node 22; install pnpm directly.
    sudo npm install -g pnpm@10 --silent
    # sbx injects a placeholder GH_TOKEN and its proxy swaps it for the stored
    # github secret in flight — no real credential lands here. setup-git wires
    # git's credential helper to gh so HTTPS pushes authenticate the same way.
    gh auth setup-git
    git config --global user.name '$git_name'
    git config --global user.email '$git_email'
    # Host remotes use SSH but the sandbox has no keys. Rewrite to HTTPS in the
    # container-local gitconfig so pushes go through gh's credential helper + proxy.
    # Covers the plain form and the 'github-personal' ssh alias; 'github-work' is
    # deliberately NOT rewritten — the stored sbx github secret is the personal
    # account, and a silent rewrite would push work repos with the wrong identity.
    git config --global url.'https://github.com/'.insteadOf 'git@github.com:'
    git config --global --add url.'https://github.com/'.insteadOf 'git@github-personal:'
    # Expose host user skills (mounted ro, if at all) to the sandboxed claude.
    if [ -d /Users/bojan/.agents/skills ]; then
      mkdir -p ~/.claude && ln -sfn /Users/bojan/.agents/skills ~/.claude/skills
    fi
  "
}
