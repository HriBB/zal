# PROTOTYPE — throwaway, Phase 4

**Question:** What should the new zal-lj.si homepage look like?

**Run:** `python3 -m http.server 4321` from this folder → http://localhost:4321/?variant=a

Switch designs: floating bar arrows, `←`/`→` keys, or `?variant=a|b|c|d|e`.

## Design system extracted from old site

- Primary red: `#8b1d1c` (from `Logo_rdeč_prosojen.png`)
- Secondary red: `#ba3741` (live site CSS)
- Logo: `assets/logo-red.png` / `logo-light.png` / `logo-black.png`
- Favicon on old site: `Logo_prosojen.png` (light logo)
- Old look: parchment/handwriting bg texture, dark red accents, dark footer

## Variants

| Key | Name | Idea |
|-----|------|------|
| a | Institucionalna | Modern evolution of current site — photo hero + search, service cards, news grid |
| b | Pergament | Editorial/newspaper — serif masthead, parchment, lead story = arhivalija meseca, dated news column |
| c | Belina | Swiss minimal — left sidebar nav, huge type, numbered unit table, grayscale→color images |
| d | Razstava | Split-screen museum — left sticky image panel (hover units swaps exhibit), right scroll content, pill nav |
| e | Mozaik | Bento grid — mosaic of tiles (search, arhivalija, services, units, uradne ure), red only as accent |

All content is real (posts.json titles, sitemap IA, unit emails, 1320 charter, fototeka images).

## Verdict

**Winner: variant A — Institucionalna** (picked by Bojan, 2026-06-05).

Modern evolution of the current site: red utility bar, sticky white header, full-bleed
historic-photo hero with search, service cards, news grid with tag chips, 5-unit photo
strip, red arhivalija-meseca CTA band, dark 4-column footer.

Carry into Phase 5 as the design-system base: red `#8b1d1c` primary / `#ba3741` secondary,
Inter, white surfaces + stone-50 sections, dark `#171412` footer.

Prototype is throwaway — rewrite properly (blocks, tests) in the real app, then delete this folder.
