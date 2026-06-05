import { index, layout } from '@react-router/dev/routes'

import type { RouteConfig } from '@react-router/dev/routes'

export default [
  // Front-end website chrome (shared Header + Footer).
  layout('./routes/website/layout.tsx', [
    index('./routes/website/home.tsx'),
  ]),
] satisfies RouteConfig
