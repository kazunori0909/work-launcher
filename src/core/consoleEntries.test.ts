import { describe, expect, it } from 'vitest'
import { compileRule } from './console'
import {
  countLevel,
  filterEntries,
  opensConsole,
  promptFor,
  promptLines,
  runEventEntries
} from './consoleEntries'
import type { NewEntry } from './consoleEntries'

const rules = [compileRule({ pattern: 'ERROR', level: 'error' })]
const exit = { type: 'exit', runId: 1, label: 'ビルド', signal: null } as const

describe('runEventEntries', () => {
  it('開始はプロンプトと本文を出し、コンソールを開く', () => {
    const entries = runEventEntries(
      {
        type: 'start',
        runId: 1,
        label: 'ビルド',
        pageId: 'top',
        path: [0],
        kind: 'sh',
        cwd: '/w',
        script: 'echo a\necho b\n'
      },
      rules
    )
    expect(entries).toEqual([
      { type: 'start', text: '▶ ビルド', level: 'info', runId: 1 },
      { type: 'prompt', text: '/w $', command: 'echo a', runId: 1 },
      { type: 'prompt', text: '>', command: 'echo b', runId: 1 }
    ])
    expect(entries.some(opensConsole)).toBe(true)
  })

  it('出力の行はルールで色分けし、コンソールは開かない', () => {
    const entries = runEventEntries(
      { type: 'output', runId: 1, stream: 'stdout', lines: ['ok', 'ERROR x'] },
      rules
    )
    expect(entries.map((e) => e.type === 'line' && e.style.level)).toEqual(['info', 'error'])
    expect(entries.every((e) => e.runId === 1)).toBe(true)
    expect(entries.some(opensConsole)).toBe(false)
  })

  it('function の知らせ。エラーだけコンソールを開く', () => {
    const info = runEventEntries({ type: 'message', level: 'info', text: 'hi' }, rules)
    const error = runEventEntries({ type: 'message', level: 'error', text: 'ng' }, rules)
    expect(info.some(opensConsole)).toBe(false)
    expect(error).toEqual([{ type: 'system', text: 'ng', level: 'error' }])
    expect(error.some(opensConsole)).toBe(true)
  })

  it.each([
    [{ ...exit, code: 0 }, '■ ビルド 終了（コード 0）', 'success'],
    [{ ...exit, code: null }, '■ ビルド 停止しました', 'warn'],
    [{ ...exit, code: 2 }, '■ ビルド 失敗（コード 2）', 'error'],
    [{ ...exit, code: null, error: '見つかりません' }, '■ ビルド: 見つかりません', 'error']
  ])('終了 %o', (event, text, level) => {
    expect(runEventEntries(event, rules)).toEqual([{ type: 'end', text, level, runId: 1 }])
  })
})

describe('filterEntries', () => {
  const run = (runId: number, label: string, lines: string[], code: number | null): NewEntry[] => [
    ...runEventEntries(
      { type: 'start', runId, label, kind: 'sh', cwd: '/w', script: 'make' },
      rules
    ),
    ...runEventEntries({ type: 'output', runId, stream: 'stdout', lines }, rules),
    ...runEventEntries({ ...exit, runId, label, code }, rules)
  ]
  const entries = [
    ...run(1, 'テスト', ['ok'], 0),
    ...runEventEntries({ type: 'message', level: 'info', text: 'hi' }, rules),
    ...run(2, 'ビルド', ['a', 'ERROR x'], 0),
    ...run(3, 'デプロイ', ['b'], 2),
    ...run(4, '監視', ['c'], null),
    ...runEventEntries({ type: 'message', level: 'error', text: 'ng' }, rules)
  ]
  const texts = (filter: 'all' | 'warn' | 'error'): string[] =>
    filterEntries(entries, filter).map((e) => e.text)

  it('すべてのときは全部出す', () => {
    expect(filterEntries(entries, 'all')).toBe(entries)
  })

  it('エラーのみ: 当たる行と、その実行の開始・終了だけ。プロンプトは出さない', () => {
    expect(texts('error')).toEqual([
      '▶ ビルド',
      'ERROR x',
      '■ ビルド 終了（コード 0）',
      '▶ デプロイ',
      '■ デプロイ 失敗（コード 2）',
      'ng'
    ])
  })

  it('件数は絞り込みで当たる行を数える（失敗・停止の終了とアプリのエラーも含む）', () => {
    expect(countLevel(entries, 'error')).toBe(3)
    expect(countLevel(entries, 'warn')).toBe(1)
  })

  it('警告以上: 停止した実行も残す', () => {
    expect(texts('warn')).toEqual([
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
})

describe('プロンプト', () => {
  it('種類ごとの形', () => {
    expect(promptFor('bat', 'C:\\w')).toBe('C:\\w>')
    expect(promptFor('powershell', 'C:\\w')).toBe('PS C:\\w>')
    expect(promptFor('python', '/w')).toBe('/w $')
  })

  it('長い本文は10行までにして行数を添える', () => {
    const script = Array.from({ length: 12 }, (_, i) => `l${i}`).join('\n')
    const lines = promptLines('$', script)
    expect(lines).toHaveLength(11)
    expect(lines[10]).toEqual({ type: 'prompt', text: '>', command: '…（全 12 行）' })
  })
})
