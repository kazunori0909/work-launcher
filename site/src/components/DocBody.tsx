import { useState, useSyncExternalStore } from 'react'
import type { Lang } from '../../../src/core/i18n'
import { HELP_BOOKS } from '../../../src/renderer/src/help/sections'
import { SITE } from '../i18n'
import { WebHelp } from './WebHelp'

const PLATFORMS = [
  { value: 'win32', label: 'Windows' },
  { value: 'darwin', label: 'macOS' }
] as const

const noSubscribe = (): (() => void) => () => {}
const viewerPlatform = (): string => (navigator.userAgent.includes('Mac') ? 'darwin' : 'win32')

/** ヘルプの1章の本文。見本の OS は切り替えられる（既定は見ている人の OS） */
export function DocBody({ lang, id }: { lang: Lang; id: string }): React.JSX.Element | null {
  // 既定は見ている人の OS。ビルド時と hydration 中は Windows で描く
  const detected = useSyncExternalStore(noSubscribe, viewerPlatform, () => 'win32')
  const [chosen, setPlatform] = useState<string>()
  const platform = chosen ?? detected

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
            onClick={() => setPlatform(p.value)}
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
