import { describe, expect, it } from 'vitest'
import { compileRule } from './console'
import { runEventEntries } from './consoleEntries'
import type { ConsoleFilter, NewEntry } from './consoleEntries'
import { ConsoleLog } from './consoleLog'
import type { FilterMark, LineNodes } from './consoleLog'

const rules = [compileRule({ pattern: 'ERROR', level: 'error' })]
const exit = { type: 'exit', runId: 1, label: 'ビルド', signal: null } as const

interface Node {
  text: string
  marks: Set<FilterMark>
}

const nodes: LineNodes<Node> = {
  create: (entry, marks) => ({ text: entry.text, marks: new Set(marks) }),
  mark: (node, mark) => node.marks.add(mark)
}

/** 画面と同じく、残っている要素のうち絞り込みで出るものの文字 */
function makeLog(max = 1000): {
  log: ConsoleLog<Node>
  append(entries: NewEntry[]): void
  texts(filter: ConsoleFilter): string[]
} {
  const log = new ConsoleLog(nodes, max)
  let shown: Node[] = []
  return {
    log,
    append(entries) {
      const { added, removed } = log.append(entries)
      shown = [...shown, ...added].filter((n) => !removed.includes(n))
    },
    texts: (filter) =>
      shown.filter((n) => filter === 'all' || n.marks.has(`in-${filter}`)).map((n) => n.text)
  }
}

const start = (runId: number, label: string): NewEntry[] =>
  runEventEntries({ type: 'start', runId, label, kind: 'sh', cwd: '/w', script: 'make' }, rules)
const output = (runId: number, lines: string[]): NewEntry[] =>
  runEventEntries({ type: 'output', runId, stream: 'stdout', lines }, rules)
const end = (runId: number, label: string, code: number | null): NewEntry[] =>
  runEventEntries({ ...exit, runId, label, code }, rules)

describe('ConsoleLog の絞り込み', () => {
  const run = (runId: number, label: string, lines: string[], code: number | null): NewEntry[] => [
    ...start(runId, label),
    ...output(runId, lines),
    ...end(runId, label, code)
  ]
  const entries = [
    ...run(1, 'テスト', ['ok'], 0),
    ...runEventEntries({ type: 'message', level: 'info', text: 'hi' }, rules),
    ...run(2, 'ビルド', ['a', 'ERROR x'], 0),
    ...run(3, 'デプロイ', ['b'], 2),
    ...run(4, '監視', ['c'], null),
    ...runEventEntries({ type: 'message', level: 'error', text: 'ng' }, rules)
  ]
  const one = makeLog()
  one.append(entries)

  it('すべてのときは全部出す', () => {
    expect(one.texts('all')).toHaveLength(entries.length)
  })

  it('エラーのみ: 当たる行と、その実行の開始・終了だけ。プロンプトは出さない', () => {
    expect(one.texts('error')).toEqual([
      '▶ ビルド',
      'ERROR x',
      '■ ビルド 終了（コード 0）',
      '▶ デプロイ',
      '■ デプロイ 失敗（コード 2）',
      'ng'
    ])
  })

  it('警告以上: 停止した実行も残す', () => {
    expect(one.texts('warn')).toEqual([
      '▶ ビルド',
      'ERROR x',
      '■ ビルド 終了（コード 0）',
      '▶ デプロイ',
      '■ デプロイ 失敗（コード 2）',
      '▶ 監視',
      '■ 監視 停止しました',
      'ng'
    ])
  })

  it('件数は絞り込みで当たる行を数える（失敗・停止の終了とアプリのエラーも含む）', () => {
    expect(one.log.counts).toEqual({ size: entries.length, error: 3, warn: 1 })
  })

  it('少しずつ足しても同じ。後から当たる行が出たら、先に出した開始の行にも印を足す', () => {
    const each = makeLog()
    for (const e of entries) each.append([e])
    for (const f of ['all', 'warn', 'error'] as const) expect(each.texts(f)).toEqual(one.texts(f))
    expect(each.log.counts).toEqual(one.log.counts)
  })
})

describe('ConsoleLog の上限', () => {
  const lines = (n: number, text = 'x'): NewEntry[] => output(1, Array(n).fill(text))

  it('上限を超えたら、上限の1割をまとめて古い方から捨て、件数からも引く', () => {
    const c = makeLog(100)
    c.append(lines(50, 'ERROR a'))
    c.append(lines(50))
    expect(c.log.counts).toEqual({ size: 100, error: 50, warn: 0 })
    c.append(lines(1))
    expect(c.log.counts).toEqual({ size: 90, error: 39, warn: 0 })
    expect(c.texts('all')).toHaveLength(90)
  })

  it('上限より多く溜まっていたら、古い方は要素にしない', () => {
    const c = makeLog(10)
    const { added, removed } = c.log.append(lines(25))
    expect(added).toHaveLength(10)
    expect(removed).toEqual([])
    expect(c.log.counts.size).toBe(10)
  })

  it('要素にしなかった行も、実行の開始・終了の印には数える', () => {
    const c = makeLog(10)
    c.append(start(1, 'ビルド'))
    c.append([...output(1, ['ERROR x']), ...lines(30), ...end(1, 'ビルド', 0)])
    expect(c.log.counts.error).toBe(0)
    expect(c.texts('error')).toEqual(['■ ビルド 終了（コード 0）'])
  })

  it('消すと件数も戻る', () => {
    const c = makeLog()
    c.append(lines(3, 'ERROR'))
    c.log.clear()
    expect(c.log.counts).toEqual({ size: 0, error: 0, warn: 0 })
  })
})

describe('ConsoleLog の溜めて少しずつ足す', () => {
  const lines = (n: number): NewEntry[] => output(1, Array(n).fill('x'))

  it('more() が true の間だけ、200 行ずつ要素にする', () => {
    const log = new ConsoleLog(nodes, 10_000)
    log.enqueue(lines(500))
    let asked = 0
    const { added } = log.drain(() => asked++ < 2)
    expect(added).toHaveLength(400)
    expect(log.pendingCount).toBe(100)
    expect(log.counts.size).toBe(400)
    expect(log.drain(() => true).added).toHaveLength(100)
    expect(log.pendingCount).toBe(0)
  })

  it('drain されないまま上限の2倍を超えて溜まったら、上限まで減らす', () => {
    const log = new ConsoleLog(nodes, 10)
    log.enqueue(lines(21))
    expect(log.pendingCount).toBe(10)
  })

  it('消すと溜めた分も捨てる', () => {
    const log = new ConsoleLog(nodes, 10)
    log.enqueue(lines(5))
    log.clear()
    expect(log.pendingCount).toBe(0)
  })
})
