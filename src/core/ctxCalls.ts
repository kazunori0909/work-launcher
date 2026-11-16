import type { OfficeKind } from './office'
import { EXEC_KINDS } from './types'
import type { ExecKind } from './types'

// function の ctx から頼む、項目と同じ動作（仕様は docs/config.md 3.2）

export type CtxCall =
  | { action: 'open'; path: string }
  | { action: 'url'; url: string; params?: Record<string, string> }
  | { action: OfficeKind; path: string; readonly: boolean }
  | {
      action: 'exec'
      kind: ExecKind
      script: string
      cwd?: string
      env?: Record<string, string>
      encoding?: string
      /** false なら、始めたところで結果を返す */
      wait: boolean
      /** false なら、コンソールに出さない */
      console: boolean
    }

/** 動作の結果。失敗したら error。終わりを待った実行系は終了コードと出力が入る */
export interface CtxResult extends Partial<ExecResult> {
  error?: string
}

/** 終わりを待った実行系が返すもの。止めたときは code が null */
export interface ExecResult {
  code: number | null
  signal: string | null
  /** 標準出力・標準エラー出力（行を改行でつないだもの） */
  stdout: string
  stderr: string
}

const OFFICE_KINDS = ['excel', 'powerpoint', 'word'] as const

/** ctx に並べる動作の名前（YAML の種類キーと同じ） */
export const CTX_ACTIONS = ['open', 'url', ...OFFICE_KINDS, ...EXEC_KINDS] as const
export type CtxAction = (typeof CTX_ACTIONS)[number]

const EXEC_OPTIONS = ['cwd', 'env', 'encoding', 'wait', 'console']
const OPTION_KEYS: Record<CtxAction, readonly string[]> = {
  open: [],
  url: ['params'],
  excel: ['readonly'],
  powerpoint: ['readonly'],
  word: ['readonly'],
  bat: EXEC_OPTIONS,
  sh: EXEC_OPTIONS,
  powershell: EXEC_OPTIONS,
  python: EXEC_OPTIONS
}

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v)

/** `ctx.<name>(value, options)` の引数を確かめ、頼む内容にする。誤りは例外にする */
export function ctxCall(name: CtxAction, value: unknown, options: unknown = {}): CtxCall {
  const fail = (message: string): never => {
    throw new Error(`ctx.${name}: ${message}`)
  }
  if (typeof value !== 'string' || value === '') fail('1つ目の引数は文字列で書いてください')
  if (!isObj(options)) fail('2つ目の引数は { キー: 値 } で書いてください')
  const first = value as string
  const opts = options as Record<string, unknown>
  const keys = OPTION_KEYS[name]
  const unknown = Object.keys(opts).filter((k) => !keys.includes(k))
  if (unknown.length > 0) {
    fail(
      `書けないキーです: ${unknown.join(', ')}` +
        (keys.length > 0 ? `（書けるのは ${keys.join(' / ')}）` : '')
    )
  }

  const str = (key: string): string | undefined => {
    const v = opts[key]
    if (v !== undefined && typeof v !== 'string') fail(`${key} は文字列で書いてください`)
    return v as string | undefined
  }
  const bool = (key: string, fallback: boolean): boolean => {
    const v = opts[key] ?? fallback
    if (typeof v !== 'boolean') fail(`${key} は true / false で書いてください`)
    return v as boolean
  }
  const dict = (key: string): Record<string, string> | undefined => {
    const v = opts[key]
    if (v === undefined) return undefined
    if (!isObj(v) || Object.values(v).some((x) => typeof x === 'object' && x !== null)) {
      fail(`${key} は { 名前: 値 } で書いてください`)
    }
    return Object.fromEntries(
      Object.entries(v as Record<string, unknown>).map(([k, x]) => [k, String(x ?? '')])
    )
  }

  switch (name) {
    case 'open':
      return { action: 'open', path: first }
    case 'url':
      return { action: 'url', url: first, params: dict('params') }
    case 'excel':
    case 'powerpoint':
    case 'word':
      return { action: name, path: first, readonly: bool('readonly', false) }
    default:
      return {
        action: 'exec',
        kind: name,
        script: dedent(first),
        cwd: str('cwd'),
        env: dict('env'),
        encoding: str('encoding'),
        wait: bool('wait', true),
        console: bool('console', true)
      }
  }
}

/**
 * 関数の中にバッククォートで書いた本文を、YAML の `|` と同じ形にする。
 * 前後の空行と、空でない行に共通する先頭の空白を取り除く
 */
export function dedent(script: string): string {
  const lines = script.split(/\r?\n/)
  while (lines.length > 0 && lines[0].trim() === '') lines.shift()
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') lines.pop()
  const indents = lines.filter((l) => l.trim() !== '').map((l) => /^[ \t]*/.exec(l)![0].length)
  const cut = indents.length > 0 ? Math.min(...indents) : 0
  return lines.map((l) => l.slice(cut)).join('\n')
}
