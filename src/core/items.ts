// 画面とメインの両方から使うため、node: モジュールに依存させない
import { assertNever } from './types'
import type { ExecKind, Item, Project } from './types'
import { t } from './i18n'

/** この OS で実行する種類。実行できなければ undefined */
export function execKindFor(
  scripts: Partial<Record<ExecKind, string>>,
  platform: string
): ExecKind | undefined {
  // bat は Windows だけ。sh は Windows でも Git Bash で動かす
  if (platform === 'win32' && scripts.bat !== undefined) return 'bat'
  if (scripts.sh !== undefined) return 'sh'
  if (scripts.powershell !== undefined) return 'powershell'
  if (scripts.python !== undefined) return 'python'
  return undefined
}

/** md の値がファイルのパスか。1行だけで .md で終わればファイル、それ以外は本文 */
export function isMdFilePath(value: string): boolean {
  const v = value.trim()
  return !v.includes('\n') && /\.md$/i.test(v)
}

/** label が無いときの表示名。種類キーの値から作る（実行系はこの OS で実行する方の本文） */
export function itemLabel(item: Item, platform: string): string {
  if (item.kind === 'error') return t().run.errorLabel
  if (item.kind === 'break') return ''
  if (item.kind === 'heading') return item.text
  if (item.kind === 'buttons') return ''
  if (item.kind === 'group') return item.title ?? ''
  if (item.kind === 'select') return item.label ?? item.name
  if (item.label) return item.label
  switch (item.kind) {
    case 'function':
      return item.fn
    case 'reset':
      return t().run.resetLabel
    case 'exec':
      return (
        (item.scripts[execKindFor(item.scripts, platform)!] ?? Object.values(item.scripts)[0])
          ?.trim()
          .split('\n')[0] ?? ''
      )
    case 'url':
      return item.url.replace(/^\w+:\/\//, '').split(/[/?#]/)[0]
    case 'html':
    case 'markdown':
      return item.kind
    case 'excel':
    case 'powerpoint':
    case 'word':
    case 'open':
    case 'mdfile':
      return item.path.split(/[\\/]/).filter(Boolean).pop() ?? item.path
    default:
      return assertNever(item)
  }
}

/**
 * icon を書かなかったときのアイコン（Lucide の名前）。ボタンでない項目は undefined。
 * `icon: ""` と書けばアイコンを出さない（呼び出し側で `??` を使うため）
 */
export function defaultIcon(item: Item): string | undefined {
  switch (item.kind) {
    case 'exec':
      return 'terminal'
    case 'url':
      return 'globe'
    case 'open':
      return looksLikeFile(item.path) ? 'file' : 'folder-open'
    case 'function':
      return 'code'
    case 'reset':
      return 'list-restart'
    case 'excel':
      return 'file-spreadsheet'
    case 'powerpoint':
      return 'presentation'
    case 'word':
      return 'file-text'
    case 'html':
    case 'markdown':
    case 'mdfile':
    case 'group':
    case 'buttons':
    case 'select':
    case 'break':
    case 'heading':
    case 'error':
      return undefined
    default:
      return assertNever(item)
  }
}

/** 最後の要素に拡張子があればファイルとみなす（`.launcher` のように `.` 始まりだけならフォルダ） */
function looksLikeFile(p: string): boolean {
  const last = p.split(/[\\/]/).filter(Boolean).pop() ?? ''
  return /.\.[^.]+$/.test(last)
}

/** url に params を URL エンコードして足す。url が不正なら例外 */
export function buildUrl(url: string, params?: Record<string, string>): string {
  const u = new URL(url)
  for (const [k, v] of Object.entries(params ?? {})) u.searchParams.append(k, v)
  return u.toString()
}

/** 子の項目も含めて、すべての項目を並び順（親 → 子）で返す */
export function walkItems(items: Item[]): Item[] {
  return items.flatMap((item) => ('items' in item ? [item, ...walkItems(item.items)] : [item]))
}

/** 項目の位置の並びを、実行中の照合に使う文字列にする */
export const pathKey = (path: number[]): string => path.join('.')

/** 位置の並び（`[2, 0]` は3番目の項目の中の1番目）で項目を探す */
export function itemAt(items: Item[], path: number[]): Item | undefined {
  let list = items
  let found: Item | undefined
  for (const i of path) {
    found = list[i]
    if (!found) return undefined
    list = 'items' in found ? found.items : []
  }
  return found
}

export type SelectItem = Extract<Item, { kind: 'select' }>

/** 記憶した値が無いときの値。default、無ければ最初の選択肢 */
export function selectDefault(item: SelectItem): string {
  return item.default ?? item.options[0]?.value ?? ''
}

/** 案件のすべての select（同じ ID は最初のもの） */
export function selectItems(project: Project): Map<string, SelectItem> {
  const map = new Map<string, SelectItem>()
  for (const page of project.pages) {
    for (const item of walkItems(page.items)) {
      if (item.kind === 'select' && !map.has(item.name)) map.set(item.name, item)
    }
  }
  return map
}

/**
 * select の値を決める。requested（画面で選んだ値・記憶した値）が選択肢にあればそれ、無ければ既定値。
 * 案件に無い ID は捨てる
 */
export function resolveSelections(
  project: Project,
  requested: Record<string, unknown> = {}
): Record<string, string> {
  const values: Record<string, string> = {}
  for (const [name, item] of selectItems(project)) {
    const v = requested[name]
    values[name] = item.options.some((o) => o.value === v) ? (v as string) : selectDefault(item)
  }
  return values
}

/**
 * 画面で使う select の値。画面で選んだ値 → 記憶した値（remember: true のものだけ）→ 既定値 の順に使う
 */
export function currentSelections(
  project: Project,
  remembered: Record<string, string> = {},
  chosen: Record<string, string> = {}
): Record<string, string> {
  const requested: Record<string, string> = {}
  for (const [name, item] of selectItems(project)) {
    if (item.remember && name in remembered) requested[name] = remembered[name]
  }
  return resolveSelections(project, { ...requested, ...chosen })
}

const SELECT_VARIABLE = /(\$?)\$\{select:([^}]+)\}/g

/**
 * `${select:ID}` だけを置き換える（画面の confirm 用。ほかの変数はそのまま）。
 * 無い ID は空文字にして missing に入れる
 */
export function expandSelect(
  text: string,
  values: Record<string, string>
): { value: string; missing: string[] } {
  const missing: string[] = []
  const value = text.replace(SELECT_VARIABLE, (match, escape: string, name: string) => {
    if (escape) return match.slice(1)
    if (name in values) return values[name]
    missing.push(name)
    return ''
  })
  return { value, missing }
}
