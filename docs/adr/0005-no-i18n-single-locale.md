# No i18n machinery, single locale (sl)

The site is Slovenian-only: no `language` field, no locale routing, `lang="sl"`. The WP dump contains zero English content, so i18n machinery would cost (language filters in every query, per-language navigation, Studio complexity) with nothing to show. Migration path if EN ever arrives: `@sanity/document-internationalization` + a `language` field + locale-prefixed routing, as in the slackalien reference.
