import { useEffect, useState } from 'react'
import { icons as allIcons } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { HELP_ICONS } from 'virtual:help-icons'
import { iconName, lookupIcon } from '../../src/renderer/src/lib/iconNames'

// アプリの src/renderer/src/lib/icons.ts の代わり（astro.config.mjs で差し替える）。
// ブラウザに送るのは、ヘルプの見本で使うアイコンだけ。全部はアイコン一覧を開いたときに読む。
// ビルド時（SSR）は全部を使う（import.meta.env.SSR が false のブラウザ向けでは、allIcons は消える）

export { iconName }

let loaded: Record<string, LucideIcon> | undefined = import.meta.env.SSR ? allIcons : undefined

export const findIcon = (name: string): LucideIcon | undefined =>
  lookupIcon(HELP_ICONS, name) ?? (loaded && lookupIcon(loaded, name))

/** アイコン一覧に出す名前。ブラウザで全部を読み込んでから返す（それまでとビルド時は空） */
export function useIconNames(): readonly string[] {
  const [names, setNames] = useState<readonly string[]>([])
  useEffect(() => {
    let alive = true
    import('./allIcons').then((m) => {
      loaded = m.icons
      if (alive) setNames(Object.keys(m.icons).map(iconName))
    })
    return () => {
      alive = false
    }
  }, [])
  return names
}
