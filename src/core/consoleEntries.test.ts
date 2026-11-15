import { describe, expect, it } from 'vitest'
import { compileRule } from './console'
import { opensConsole, promptFor, promptLines, runEventEntries } from './consoleEntries'

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
      { type: 'start', text: '▶ ビルド', level: 'info' },
      { type: 'prompt', text: '/w $', command: 'echo a' },
      { type: 'prompt', text: '>', command: 'echo b' }
    ])
    expect(entries.some(opensConsole)).toBe(true)
  })

  it('出力の行はルールで色分けし、コンソールは開かない', () => {
    const entries = runEventEntries(
      { type: 'output', runId: 1, stream: 'stdout', lines: ['ok', 'ERROR x'] },
      rules
    )
    expect(entries.map((e) => e.type === 'line' && e.style.level)).toEqual(['info', 'error'])
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
    expect(runEventEntries(event, rules)).toEqual([{ type: 'end', text, level }])
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
