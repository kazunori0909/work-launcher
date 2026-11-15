import type { ReactNode } from 'react'
import { Section } from './parts'
import type { SectionProps } from './parts'
import { ConsoleColors } from './sections/ConsoleColors'
import { Display } from './sections/Display'
import { Edit } from './sections/Edit'
import { Elements } from './sections/Elements'
import { Errors } from './sections/Errors'
import { Events } from './sections/Events'
import { Info } from './sections/Info'
import { Items } from './sections/Items'
import { LicensesSection } from './sections/LicensesSection'
import { Look } from './sections/Look'
import { Pages } from './sections/Pages'
import { Start } from './sections/Start'
import { Variables } from './sections/Variables'

// 組み込みのヘルプ。仕様の正は docs/config.md。ここは利用者向けに要点と見本を載せる。
// 章の本文は sections/ に1章1ファイルで置く

interface HelpSection {
  id: string
  title: string
  /** 章の本文（Section で囲んで返す）。案件の章は無し（設定の help ページを出す） */
  Body?: (props: SectionProps) => React.JSX.Element
}

/** 章の一覧。サイドメニューでは分類ごとに二階層で出す（label が無い分類は見出しを出さない） */
const SECTION_GROUPS: readonly { label?: string; sections: readonly HelpSection[] }[] = [
  {
    label: 'まず読む',
    sections: [
      { id: 'start', title: 'はじめに', Body: Start },
      { id: 'edit', title: '設定ファイルの編集', Body: Edit },
      { id: 'pages', title: 'ページの追加', Body: Pages },
      { id: 'errors', title: 'エラーが出たとき', Body: Errors },
      { id: 'licenses', title: 'ライセンス', Body: LicensesSection }
    ]
  },
  {
    label: '要素を追加する',
    sections: [
      { id: 'items', title: 'ボタンを追加', Body: Items },
      { id: 'elements', title: 'ボタン以外の要素', Body: Elements },
      { id: 'display', title: 'グループとアイコン', Body: Display }
    ]
  },
  {
    label: '設定',
    sections: [
      { id: 'variables', title: '変数', Body: Variables },
      { id: 'events', title: 'イベント', Body: Events },
      { id: 'console', title: 'コンソールの色分け', Body: ConsoleColors },
      { id: 'info', title: 'Info ページ', Body: Info },
      { id: 'look', title: 'タイトルと見た目', Body: Look }
    ]
  }
]

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
  const projectSection: HelpSection = { id: PROJECT_ID, title: projectTitle }
  const groups = projectHelp ? [{ sections: [projectSection] }, ...SECTION_GROUPS] : SECTION_GROUPS
  const sections = groups.flatMap((g) => g.sections)
  const active = sections.find((s) => s.id === selected) ?? sections[0]

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
        {active.Body ? (
          <active.Body {...props} />
        ) : (
          <Section id={PROJECT_ID} title={projectTitle}>
            {projectHelp}
          </Section>
        )}
      </article>
    </div>
  )
}
