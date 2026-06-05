import { index, layout, prefix, route } from '@react-router/dev/routes'

import type { RouteConfig } from '@react-router/dev/routes'

export default [
  // Front-end website (shared Header + Footer).
  layout('./routes/website/layout.tsx', [
    index('./routes/website/home.tsx'),
    // Posts + categories.
    route('novice', './routes/website/novice.tsx'),
    route('novice/:slug', './routes/website/novice.$slug.tsx'),
    route('arhivalija-meseca', './routes/website/arhivalija-meseca.tsx'),
    // Archive units.
    route('enote/:slug', './routes/website/enote.$slug.tsx'),
    // Digiteka: digital collections.
    route('digiteka', './routes/website/digiteka.tsx'),
    route('digiteka/:collection', './routes/website/digiteka.$collection.tsx'),
    route('digiteka/:collection/:item', './routes/website/digiteka.$collection.$item.tsx'),
    // Search.
    route('iskanje', './routes/website/iskanje.tsx'),
    // Catch-all page route — resolves nested pages via parent chain (ADR-0004).
    // Must come last so specific routes above take priority.
    route('*', './routes/website/page.tsx'),
  ]),
  // Embedded Sanity Studio.
  route('studio/*', './routes/studio.tsx'),
  // Resource routes (Visual Editing preview toggle).
  ...prefix('resource', [route('preview', './routes/resource/preview.ts')]),
] satisfies RouteConfig
