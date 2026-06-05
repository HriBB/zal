# Nested pages via parent references

A Page stores only its own slug segment plus an optional `parent` reference; its URL is the parent chain (`/parent/child`). The catch-all route resolves the full chain strictly (every segment must match) — a correct-leaf-wrong-chain URL is a 404. Practical depth is 3 (matches the old site's IA). Navigation is independent: an editor-curated menu in Site settings, so menu reshuffles never move URLs.

Considered: storing the full path in one slug field (simpler queries, no chain resolution) — rejected because moving a subtree would mean hand-editing every descendant's slug; with parent refs the tree is real and breadcrumbs fall out of the chain.
