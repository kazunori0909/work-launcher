import { useEffect, useSyncExternalStore } from 'react'
import type { Lang } from '../../../src/core/i18n'
import { HELP_BOOKS } from '../../../src/renderer/src/help/sections'
import { SITE } from '../i18n'
import { WebHelp } from './WebHelp'

const PLATFORMS = [
  { value: 'win32', label: 'Windows' },
  { value: 'darwin', label: 'macOS' }
] as const

// 見本の OS は <html> の data-platform に置く。描く前に [id].astro の <head> のスクリプトが、
// 選んだ OS（sessionStorage。タブを閉じるまで章をまたいで残る）か、見ている人の OS を入れる
const KEY = 'samplePlatform'
const listeners = new Set<() => void>()
const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
const getPlatform = (): string => document.documentElement.dataset.platform ?? 'win32'

function choosePlatform(platform: string): void {
  document.documentElement.dataset.platform = platform
  try {
    sessionStorage.setItem(KEY, platform)
  } catch {
    // 残せなくても、このページでは切り替える
  }
  for (const listener of listeners) listener()
}

/** ヘルプの1章の本文。見本の OS は切り替えられる（既定は見ている人の OS） */
export function DocBody({ lang, id }: { lang: Lang; id: string }): React.JSX.Element | null {
  // ビルド時と hydration 中は Windows で描く
  const platform = useSyncExternalStore(subscribe, getPlatform, () => 'win32')
  // 描き直しが済んだら本文を見せる（Windows 以外では、それまで site.css で隠している）
  useEffect(() => {
    if (platform === getPlatform()) document.documentElement.dataset.platformReady = ''
  }, [platform])

  const section = HELP_BOOKS[lang].flatMap((g) => g.sections).find((s) => s.id === id)
  if (!section) return null
  return (
    <WebHelp lang={lang}>
      <div className="doc-platform" role="group" aria-label={SITE[lang].docs.platform}>
        <span>{SITE[lang].docs.platform}</span>
        {PLATFORMS.map((p) => (
          <button
            key={p.value}
            type="button"
            className={p.value === platform ? 'active' : undefined}
            aria-pressed={p.value === platform}
            onClick={() => choosePlatform(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>
      <section className="help-section">
        <section.Body platform={platform} onError={() => {}} />
      </section>
    </WebHelp>
  )
}
