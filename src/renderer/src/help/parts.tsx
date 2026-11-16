import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { execKindFor, expandSelect, itemAt, resolveSelections } from '../../../core/items'
import type { Project } from '../../../core/types'
import { highlight } from '../components/highlight'
import type { CodeLang } from '../components/highlight'
import { ItemList } from '../components/PageView'
import { SelectContext } from '../components/selectContext'
import type { SelectContextValue } from '../components/selectContext'
import type { Cheat, Example } from './examples'

// ヘルプの章で使う部品（章の枠・コード・表・見本・早見表）

export const NOT_OPEN = '（開かれていません）'

/** 章に渡すもの（使う章だけが受け取る） */
export interface SectionProps {
  launcherDir?: string
  /** 最上位の cwd から決めた作業フォルダ */
  workDir?: string
  platform: string
  onError(message: string): void
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

/** 見本の select は案件の値と混ぜず、見本ごとに値を持つ */
function useSampleSelections(items: Example['items']): SelectContextValue {
  const [chosen, setChosen] = useState<Record<string, string>>({})
  return useMemo<SelectContextValue>(() => {
    const project: Project = {
      styles: [],
      scripts: [],
      pages: [{ id: 'sample', items }],
      info: { env: [], tools: [], registry: [] }
    }
    return {
      values: resolveSelections(project, chosen),
      onChange: (item, value) => setChosen((c) => ({ ...c, [item.name]: value }))
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
            <th>種類</th>
            <th>コード</th>
            <th>表示</th>
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

/** 書き方の例と、その設定で出るボタン（本物の描画。押すと、実行する内容を下に出すだけ） */
export function SampleView({
  example,
  platform
}: {
  example: Example
  platform: string
}): React.JSX.Element {
  const selections = useSampleSelections(example.items)
  const [ran, setRan] = useState<string>()

  const activate = (path: number[]): void => {
    const item = itemAt(example.items, path)
    if (item?.kind !== 'exec') return
    const kind = execKindFor(item.scripts, platform)
    if (kind) setRan(expandSelect(item.scripts[kind] ?? '', selections.values).value)
  }

  return (
    <div className="sample">
      <Code lang="yaml">{example.yaml}</Code>
      <div className="preview">
        <span className="preview-label">表示</span>
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
            実行する内容（見本なので実行はしません）: <code>{ran}</code>
          </div>
        )}
      </div>
    </div>
  )
}
