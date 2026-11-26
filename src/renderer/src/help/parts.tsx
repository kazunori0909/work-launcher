import { Children, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { buildUrl, execKindFor, expandSelect, itemAt, resolveSelections } from '../../../core/items'
import { resetValues } from '../../../core/itemState'
import type { Project } from '../../../core/types'
import { highlight } from '../lib/highlight'
import type { CodeLang } from '../lib/highlight'
import { ItemList } from '../components/PageView'
import { SelectContext } from '../components/selectContext'
import { Alert } from '../components/Alert'
import { Icon } from '../components/Icon'
import type { AlertKind } from '../../../core/alert'
import type { SelectContextValue } from '../components/selectContext'
import type { Cheat, Example } from './examples'
import { t } from '../../../core/i18n'
import { useHelpTarget } from './target'

// ヘルプの章で使う部品（章の枠・コード・表・見本・早見表）

/** 章に渡すもの（使う章だけが受け取る） */
export interface SectionProps {
  launcherDir?: string
  /** 最上位の cwd から決めた作業フォルダ */
  workDir?: string
  platform: string
  onError(message: string): void
}

/** アプリのヘルプでだけ出す（アプリの API を呼ぶボタン・いま開いている案件の話など） */
export function OnlyApp({ children }: { children: ReactNode }): React.JSX.Element | null {
  return useHelpTarget() === 'app' ? <>{children}</> : null
}

/** Web サイト（site/）でだけ出す */
export function OnlyWeb({ children }: { children: ReactNode }): React.JSX.Element | null {
  return useHelpTarget() === 'web' ? <>{children}</> : null
}

export function Section(props: {
  id: string
  title: string
  children: ReactNode
}): React.JSX.Element {
  return (
    <section id={`help-${props.id}`} className="help-section">
      <h2>{props.title}</h2>
      {props.children}
    </section>
  )
}

/**
 * 本文の中のアラート。使う種類と数は docs/phase38-help-alerts-details/PLAN.md「アラートのルール」に沿う。
 * 中身は1〜3文の文（コード見本や表は外に置く）
 */
export function Callout({
  kind,
  children
}: {
  kind: Extract<AlertKind, 'note' | 'tip' | 'warning'>
  children: ReactNode
}): React.JSX.Element {
  return (
    <div className="help-callout">
      <Alert kind={kind}>
        <p>{bySentence(children)}</p>
      </Alert>
    </div>
  )
}

/**
 * 日本語の文ごとに .help-sentence で包み、入りきらない文を次の行から始める（→ docs/writing.md「画面での改行」）。
 * 「。」が無い文（英語など）はそのまま返す
 */
function bySentence(children: ReactNode): ReactNode {
  const sentences: ReactNode[][] = [[]]
  for (const child of Children.toArray(children)) {
    if (typeof child !== 'string') {
      sentences[sentences.length - 1].push(child)
      continue
    }
    for (const part of child.split(/(?<=[。！？])/)) {
      sentences[sentences.length - 1].push(part)
      if (/[。！？]$/.test(part)) sentences.push([])
    }
  }
  const filled = sentences.filter((s) => s.some((n) => typeof n !== 'string' || n.trim() !== ''))
  if (filled.length < 2) return children
  return filled.map((s, i) => (
    <span key={i} className="help-sentence">
      {s}
    </span>
  ))
}

/** 特定の状況でだけ要る内容を畳む（→ 同 PLAN.md「折りたたみのルール」）。見た目は details の項目と同じ */
export function Fold({
  title,
  children
}: {
  title: string
  children: ReactNode
}): React.JSX.Element {
  return (
    <details className="item-details help-fold">
      <summary>
        <Icon name="chevron-right" />
        {title}
      </summary>
      <div className="item-details-body">{children}</div>
    </details>
  )
}

/** コードの見本。lang を書けば色を付ける（フォルダ構成の図など、コードでないものは書かない） */
export function Code({ children, lang }: { children: string; lang?: CodeLang }): React.JSX.Element {
  const html = useMemo(() => (lang ? highlight(children, lang) : undefined), [children, lang])
  if (html === undefined) return <pre className="code">{children}</pre>
  // highlight は中の文字をエスケープして返す
  return <pre className={`code lang-${lang}`} dangerouslySetInnerHTML={{ __html: html }} />
}

/** 1列目はキー名としてコード書式にする（plain なら普通の文字） */
export function Table(props: {
  head: string[]
  rows: string[][]
  plain?: boolean
}): React.JSX.Element {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {props.head.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((row) => (
            <tr key={row[0]}>
              {row.map((cell, i) => (
                <td key={i}>{i === 0 && !props.plain ? <code>{cell}</code> : cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const NOT_RUNNING = new Set<string>()
const NO_ACTION = (): void => {}

/** 見本の select は案件の値と混ぜず、見本ごとに値を持つ。reset は reset の項目を押したとき */
function useSampleSelections(
  items: Example['items']
): SelectContextValue & { reset(ids: string[]): void } {
  const [chosen, setChosen] = useState<Record<string, string>>({})
  return useMemo(() => {
    const project: Project = {
      styles: [],
      scripts: [],
      pages: [{ id: 'sample', items }],
      info: { env: [], tools: [], registry: [] }
    }
    return {
      values: resolveSelections(project, chosen),
      onChange: (item, value) => setChosen((c) => ({ ...c, [item.name]: value })),
      reset: (ids) => {
        const r = resetValues(project, ids)
        if (!('error' in r)) setChosen((c) => ({ ...c, ...r.select }))
      }
    }
  }, [items, chosen])
}

/** 種類・コード・表示を1行ずつ並べた早見表 */
export function CheatSheet({
  cheats,
  platform
}: {
  cheats: Cheat[]
  platform: string
}): React.JSX.Element {
  return (
    <div className="table-wrap">
      <table className="cheatsheet">
        <thead>
          <tr>
            <th>{t().help.cheatKind}</th>
            <th>{t().help.cheatCode}</th>
            <th>{t().help.preview}</th>
          </tr>
        </thead>
        <tbody>
          {cheats.map((c) => (
            <CheatRow key={c.name} cheat={c} platform={platform} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CheatRow({ cheat, platform }: { cheat: Cheat; platform: string }): React.JSX.Element {
  const [first, ...rest] = [cheat, ...(cheat.more ?? [])]
  return (
    <>
      <tr>
        <td className="cheat-name" rowSpan={1 + rest.length}>
          <code>{cheat.name}</code>
          <div className="cheat-note">{cheat.note}</div>
        </td>
        <CheatCells example={first} platform={platform} />
      </tr>
      {rest.map((example) => (
        <tr key={example.yaml}>
          <CheatCells example={example} platform={platform} />
        </tr>
      ))}
    </>
  )
}

/** 早見表の1つの見本（コードと表示の2列） */
function CheatCells({
  example,
  platform
}: {
  example: Example
  platform: string
}): React.JSX.Element {
  const selections = useSampleSelections(example.items)
  return (
    <>
      <td>
        <Code lang="yaml">{example.yaml}</Code>
      </td>
      <td>
        <SelectContext.Provider value={selections}>
          <ItemList
            items={example.items}
            platform={platform}
            running={NOT_RUNNING}
            onActivate={NO_ACTION}
          />
        </SelectContext.Provider>
      </td>
    </>
  )
}

/**
 * 書き方の例と、その設定で出るボタン（本物の描画）。押すと、実行するコマンドか開く URL を下に出すだけ。
 * URL は params をエンコードしたあとのものを出す（エンコードされることを見せる）
 */
export function SampleView({
  example,
  platform
}: {
  example: Example
  platform: string
}): React.JSX.Element {
  const selections = useSampleSelections(example.items)
  const [ran, setRan] = useState<{ label: string; value: string }>()

  const activate = (path: number[]): void => {
    const item = itemAt(example.items, path)
    const expand = (v: string): string => expandSelect(v, selections.values).value
    if (item?.kind === 'reset') {
      selections.reset(item.ids)
      return
    }
    if (item?.kind === 'url') {
      const params = Object.entries(item.params ?? {}).map(([k, v]) => [k, expand(v)])
      try {
        setRan({
          label: t().help.sampleOpened,
          value: buildUrl(expand(item.url), Object.fromEntries(params))
        })
      } catch {
        setRan({ label: t().open.badUrl(item.url), value: '' })
      }
      return
    }
    if (item?.kind !== 'exec') return
    const kind = execKindFor(item.scripts, platform)
    if (kind) setRan({ label: t().help.sampleRan, value: expand(item.scripts[kind] ?? '') })
  }

  return (
    <div className="sample">
      <Code lang="yaml">{example.yaml}</Code>
      <div className="preview">
        <span className="preview-label">{t().help.preview}</span>
        <SelectContext.Provider value={selections}>
          <ItemList
            items={example.items}
            platform={platform}
            running={NOT_RUNNING}
            onActivate={activate}
          />
        </SelectContext.Provider>
        {ran !== undefined && (
          <div className="preview-ran">
            {ran.label} {ran.value && <code>{ran.value}</code>}
          </div>
        )}
      </div>
    </div>
  )
}
