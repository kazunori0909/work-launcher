import { parseDocument } from 'yaml'
import type { Diagnostic } from '../types'
import { t } from '../i18n'
import { pickText } from './text'

// 設定ファイルの読み方の共通部分（YAML の読み込み・値の確かめ方・エラーの集め方）

export type Obj = Record<string, unknown>

/** ファイルが無ければ undefined を返す */
export type ReadFile = (absPath: string) => Promise<string | undefined>

/** ページを出せない誤り（YAML の構文エラー・対応していない version） */
export class FatalError extends Error {
  constructor(readonly diagnostic: Diagnostic) {
    super(diagnostic.message)
  }
}

export function parseYaml(text: string, file: string): unknown {
  const doc = parseDocument(text, { prettyErrors: true })
  const err = doc.errors[0]
  if (err) {
    throw new FatalError({
      level: 'error',
      file,
      line: err.linePos?.[0].line,
      message: err.message
    })
  }
  return doc.toJS()
}

/** 文字・数・真偽値を文字列にする（YAML の `1` や `true` も選択肢の値にできるように） */
export function scalar(v: unknown): string | undefined {
  if (typeof v === 'string') return v
  if (typeof v === 'number' || typeof v === 'boolean') return String(v)
  return undefined
}

export function isObj(v: unknown): v is Obj {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/** 1回の読み込みで共有するもの（案件フォルダ・ファイルの読み方・集めたエラー） */
export class Reader {
  constructor(
    readonly launcherDir: string,
    readonly readFile: ReadFile,
    private diagnostics: Diagnostic[]
  ) {}

  list(v: unknown, file: string, where: string): unknown[] {
    if (v === undefined || v === null) return []
    if (Array.isArray(v)) return v
    this.error(file, t().load.notList(where))
    return []
  }

  strings(v: unknown, file: string, where: string): string[] {
    const list = this.list(v, file, where)
    if (list.some((x) => typeof x !== 'string')) this.error(file, t().load.notPaths(where))
    return list.filter((x) => typeof x === 'string')
  }

  str(raw: Obj, key: string, file: string): string | undefined {
    const v = raw[key]
    if (v === undefined || typeof v === 'string') return v
    this.error(file, t().load.notString(key))
    return undefined
  }

  /** 画面に出す文字（文字列か言語の表） */
  text(raw: Obj, key: string, file: string): string | undefined {
    const v = raw[key]
    if (v === undefined) return undefined
    const text = pickText(v)
    if (text === undefined) this.error(file, t().load.notText(key))
    return text
  }

  warnUnknown(raw: Obj, known: readonly string[], file: string, where: string): void {
    for (const key of Object.keys(raw)) {
      if (!known.includes(key)) {
        this.diagnostics.push({ level: 'warning', file, message: t().load.unknownKey(where, key) })
      }
    }
  }

  error(file: string, message: string): void {
    this.diagnostics.push({ level: 'error', file, message })
  }

  fatal(file: string, message: string): FatalError {
    return new FatalError({ level: 'error', file, message })
  }
}
