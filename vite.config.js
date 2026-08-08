import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: served at https://jflakeee.github.io/duolingo_base/ in production (GitHub Pages project site),
// but at '/' during local `npm run dev`.
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/duolingo_base/' : '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.js',
  },
}))
