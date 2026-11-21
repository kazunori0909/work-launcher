import type { ReactNode } from 'react'
import { Section } from './parts'
import type { SectionProps } from './parts'
import { getLang } from '../../../core/i18n'
import type { Lang } from '../../../core/i18n'
import type { HelpGroup } from './sections/book'
import { HELP_EN } from './sections/en'
import { HELP_JA } from './sections/ja'

// 組み込みのヘルプ。仕様の正は docs/config.md。ここは利用者向けに要点と見本を載せる。
// 章の本文は sections/<言語>/ に1章1ファイルで置く

/** 言語ごとの章の一覧 */
export const HELP_BOOKS: Record<Lang, readonly HelpGroup[]> = { ja: HELP_JA, en: HELP_EN }

/** 設定に書いた help ページの項目を出す章 */
const PROJECT_ID = 'project'

interface Props extends SectionProps {
  /** 表示中の章の ID。無ければ最初の章 */
  selected?: string
  onSelect(id: string): void
  /** 設定に help ページがあれば、その項目（最初の章として出す） */
  projectHelp?: ReactNode
  /** 最初の章の名前（案件名。ヘッダーと同じ） */
  projectTitle: string
}

/** 左に分類ごとの章の一覧（二階層）、右に選んだ章の本文 */
export function HelpPage({
  selected,
  onSelect,
  projectHelp,
  projectTitle,
  ...props
}: Props): React.JSX.Element {
  const book = HELP_BOOKS[getLang()]
  const projectSection = { id: PROJECT_ID, title: projectTitle }
  const groups: readonly { label?: string; sections: readonly { id: string; title: string }[] }[] =
    projectHelp ? [{ sections: [projectSection] }, ...book] : book
  const sections = book.flatMap((g) => g.sections)
  const all = groups.flatMap((g) => g.sections)
  const active = all.find((s) => s.id === selected) ?? all[0]
  const body = sections.find((s) => s.id === active.id)

  return (
    <div className="sidenav">
      <nav className="sidenav-list">
        {groups.map((g) => (
          <div key={g.label ?? PROJECT_ID} className="sidenav-group">
            {g.label && <div className="sidenav-group-label">{g.label}</div>}
            {g.sections.map(({ id, title }) => (
              <button
                key={id}
                className={id === active.id ? 'active' : undefined}
                onClick={() => {
                  onSelect(id)
                  document.querySelector('.page')?.scrollTo(0, 0)
                }}
              >
                {title}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <article className="sidenav-body help">
        <Section id={active.id} title={active.title}>
          {body ? <body.Body {...props} /> : projectHelp}
        </Section>
      </article>
    </div>
  )
}
