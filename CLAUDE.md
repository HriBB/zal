# CLAUDE.md

## Agent skills

### Issue tracker

Issues are tracked as GitHub issues via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default label vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.

## Sanity content is production data — NEVER delete it

The Sanity dataset (`pcoqweha/production`) is the live content store, shared with human editors. Agents must NEVER delete or wipe documents or assets: no `client.delete(...)`, no `delete`/`deleteMany` mutations, no `sanity dataset delete`/`import --replace`, no cleanup scripts that remove content. Seeds are create/patch only (stable `_id`s, `createOrReplace` for migrated docs, `createIfNotExists` for authored singletons). If a task seems to require deletion, stop and hand it to a human.
