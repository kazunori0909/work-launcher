import react from '@astrojs/react'
import { defineConfig } from 'astro/config'
import { fileURLToPath } from 'node:url'
import { helpIconKeys } from './helpIcons'

// GitHub Pages のサイト。ヘルプの章（src/renderer/src/help/sections/）をそのまま描く（→ docs/archive/phase29-github-pages/PLAN.md）

const VIRTUAL = 'virtual:help-icons'
const path = (p) => fileURLToPath(new URL(p, import.meta.url))

/** アプリのモジュール → サイト用の差し替え（JS を小さくするため。それぞれのファイルの冒頭を参照） */
const REPLACE = new Map([
  [path('../src/renderer/src/icons.ts'), path('./src/icons.ts')],
  [path('../src/renderer/src/components/embed.tsx'), path('./src/embed.tsx')]
])
const SITE_FILES = new Set(REPLACE.values())

function replaceModules() {
  return {
    name: 'replace-modules',
    enforce: 'pre',
    async resolveId(source, importer) {
      if (source === VIRTUAL) return `\0${VIRTUAL}`
      // 差し替え先からは本物を読む
      if (!importer || SITE_FILES.has(importer) || !/(icons|embed)$/.test(source)) return null
      const resolved = await this.resolve(source, importer, { skipSelf: true })
      return (resolved && REPLACE.get(resolved.id)) ?? null
    },
    // ヘルプの見本で使うアイコンだけを書き出す（→ helpIcons.ts）
    load(id) {
      if (id !== `\0${VIRTUAL}`) return null
      const keys = helpIconKeys()
      return `import { ${keys.join(', ')} } from 'lucide-react'\nexport const HELP_ICONS = { ${keys.join(', ')} }\n`
    }
  }
}

export default defineConfig({
  site: 'https://kazunori0909.github.io',
  base: '/work-launcher',
  integrations: [react()],
  vite: { plugins: [replaceModules()] }
})
