import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

// Standalone from vite.config.ts on purpose: the React Router plugin assumes a
// full SSR build pipeline and has no place in unit tests. We keep only the `~`
// path alias. Scope = pure logic, run in a node env; Playwright owns e2e/ and
// must stay out of Vitest's include.
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: 'node',
    include: ['app/**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'e2e', 'build', 'dist'],
  },
})
