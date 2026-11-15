import path from 'node:path'
import type { Diagnostic, Item } from '../types'
import { CONFIG_FILE, loadProject } from '.'
import type { LoadResult, ReadFile } from '.'

// 設定の読み込みのテストで使う助け（テストからだけ使う）

export const TEST_DIR = '/repo'

/** メモリ上のファイルを読む。キーは launcherDir からの相対パス（/ 区切り） */
export function memoryReader(files: Record<string, string>, dir = TEST_DIR): ReadFile {
  // Windows では path.relative が \ を返すため、/ にそろえて引く
  return async (p: string) => files[path.relative(dir, p).replaceAll(path.sep, '/')]
}

/** ファイル一式から読む */
export function loadFiles(files: Record<string, string>): Promise<LoadResult> {
  return loadProject(TEST_DIR, memoryReader(files))
}

/** 項目の YAML（`- ` で始まる並び）を、1ページだけの config.yaml に入れる。字下げはそろえ直す */
export function itemsConfig(items: string): string {
  const lines = items.replace(/^\n+|\s+$/g, '').split('\n')
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.search(/\S/)))
  const body = lines.map((l) => '      ' + l.slice(indent)).join('\n')
  return `version: 1\npages:\n  - id: top\n    items:\n${body}\n`
}

/**
 * 項目の YAML だけを読む。ほかのファイル（config.local.yaml など）は others に書く
 */
export async function loadItems(
  items: string,
  others: Record<string, string> = {}
): Promise<{ items: Item[]; diagnostics: Diagnostic[] }> {
  const r = await loadFiles({ [CONFIG_FILE]: itemsConfig(items), ...others })
  return { items: r.project?.pages[0]?.items ?? [], diagnostics: r.diagnostics }
}

/** 項目のエラーの文言（エラーでなければ false） */
export const errorMessage = (item: Item | undefined): string | false =>
  item?.kind === 'error' && item.message
