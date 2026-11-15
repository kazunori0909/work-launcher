import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { app } from 'electron'

/** アプリのユーザーデータに置くファイル（最近開いた案件・select の記憶・信頼した案件） */
export const userDataFile = (name: string): string => path.join(app.getPath('userData'), name)

/**
 * JSON のファイルを読む。無い・壊れている・形が違う（parse が undefined を返す）ときは fallback
 */
export function readJson<T>(file: string, parse: (raw: unknown) => T | undefined, fallback: T): T {
  try {
    return parse(JSON.parse(readFileSync(file, 'utf8'))) ?? fallback
  } catch {
    return fallback
  }
}

/** JSON のファイルに書く。書けなければ例外（書けなくても困らない呼び出し側は握りつぶす） */
export function writeJson(file: string, value: unknown): void {
  writeFileSync(file, JSON.stringify(value, null, 2))
}

/** 文字列の並び（ほかの値は捨てる）。並びでなければ undefined */
export const stringList = (raw: unknown): string[] | undefined =>
  Array.isArray(raw) ? raw.filter((d): d is string => typeof d === 'string') : undefined
