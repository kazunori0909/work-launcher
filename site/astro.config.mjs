import react from '@astrojs/react'
import { defineConfig } from 'astro/config'

// GitHub Pages のサイト。ヘルプの章（src/renderer/src/help/sections/）をそのまま描く（→ docs/phase29-github-pages/PLAN.md）
export default defineConfig({
  site: 'https://kazunori0909.github.io',
  base: '/work-launcher',
  integrations: [react()]
})
