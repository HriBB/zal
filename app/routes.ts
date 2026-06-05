import { index, layout, prefix, route } from '@react-router/dev/routes'

import type { RouteConfig } from '@react-router/dev/routes'

export default [
  // Front-end website (shared Header + Footer).
  layout('./routes/website/layout.tsx', [
    index('./routes/website/home.tsx'),
  ]),
  // Embedded Sanity Studio.
  route('studio/*', './routes/studio.tsx'),
  // Resource routes (Visual Editing preview toggle).
  ...prefix('resource', [route('preview', './routes/resource/preview.ts')]),
] satisfies RouteConfig
