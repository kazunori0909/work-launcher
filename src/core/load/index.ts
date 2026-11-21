import path from 'node:path'
import { mergeProject } from '../merge'
import { FORBIDDEN_SCHEMES, normalizeScheme } from '../schemes'
import type { Diagnostic, Page, Project } from '../types'
import { readInfo } from './info'
import { PAGE_ID, readItems } from './items'
import { FatalError, isObj, parseYaml, Reader } from './reader'
import type { ReadFile } from './reader'

// 設定ファイルを読み、正規化する（仕様は docs/config.md）。
// 共通の読み方は reader.ts、項目は items.ts、info は info.ts、コンソールのルールは console.ts

export { CONSOLE_FILES, loadConsoleRules } from './console'
export type { ReadFile } from './reader'

/** 起動用のファイル。中身は読まず、案件フォルダの目印とダブルクリックの入口にだけ使う */
export const PROJECT_FILE = 'work.launcher'
export const CONFIG_FILE = 'launcher/config.yaml'
export const LOCAL_FILE = 'launcher/config.local.yaml'

/** config.yaml に scripts が無いときに読む JS（フォルダなら中の .js すべて） */
export const DEFAULT_SCRIPTS = ['launcher/scripts']

export interface LoadResult {
  /** 構文エラーなど、ページを出せないときは undefined */
  project?: Project
  diagnostics: Diagnostic[]
}

const TOP_KEYS = ['version', 'title', 'cwd', 'style', 'scripts', 'openSchemes', 'pages', 'info']
const PAGE_KEYS = ['id', 'title', 'icon', 'cwd', 'items', 'replace']

export async function loadProject(launcherDir: string, readFile: ReadFile): Promise<LoadResult> {
  const diagnostics: Diagnostic[] = []
  try {
    const baseText = await readFile(path.join(launcherDir, CONFIG_FILE))
    if (baseText === undefined) {
      return {
        diagnostics: [{ level: 'error', file: CONFIG_FILE, message: 'ファイルがありません' }]
      }
    }
    const r = new Reader(launcherDir, readFile, diagnostics)
    const base = await readProject(r, baseText, CONFIG_FILE, true)
    const localText = await readFile(path.join(launcherDir, LOCAL_FILE))
    const local =
      localText === undefined ? undefined : await readProject(r, localText, LOCAL_FILE, false)
    return { project: mergeProject(base, local), diagnostics }
  } catch (e) {
    if (e instanceof FatalError) return { diagnostics: [...diagnostics, e.diagnostic] }
    throw e
  }
}

async function readProject(
  r: Reader,
  text: string,
  file: string,
  isBase: boolean
): Promise<Project> {
  const raw = parseYaml(text, file) ?? {}
  if (!isObj(raw)) throw r.fatal(file, '最上位はキーと値の組で書いてください')
  if (raw.version !== undefined && raw.version !== 1) {
    throw r.fatal(file, `version ${String(raw.version)} には対応していません（対応: 1）`)
  }
  if (isBase && raw.version === undefined) r.error(file, 'version がありません（1 と書く）')
  r.warnUnknown(raw, TOP_KEYS, file, '最上位')

  const pages: Page[] = []
  for (const entry of r.list(raw.pages, file, 'pages')) {
    const page = await readPageEntry(r, entry, file)
    if (page) pages.push(page)
  }
  return {
    title: r.str(raw, 'title', file),
    cwd: r.str(raw, 'cwd', file),
    styles: [r.str(raw, 'style', file)].filter((s) => s !== undefined),
    scripts:
      isBase && raw.scripts === undefined
        ? DEFAULT_SCRIPTS
        : r.strings(raw.scripts, file, 'scripts'),
    openSchemes: readOpenSchemes(r, raw.openSchemes, file),
    pages,
    info: readInfo(r, raw.info, file)
  }
}

/** openSchemes を正規化して読む。書いていなければ undefined（既定を使う） */
function readOpenSchemes(r: Reader, v: unknown, file: string): string[] | undefined {
  if (v === undefined) return undefined
  const schemes: string[] = []
  for (const x of r.list(v, file, 'openSchemes')) {
    const name = typeof x === 'string' ? normalizeScheme(x) : undefined
    if (name === undefined)
      r.error(file, `openSchemes にはスキーム名（http・file など）を並べてください: ${String(x)}`)
    else if (FORBIDDEN_SCHEMES.includes(name)) r.error(file, `openSchemes に ${name} は書けません`)
    else if (!schemes.includes(name)) schemes.push(name)
  }
  return schemes
}

async function readPageEntry(r: Reader, entry: unknown, file: string): Promise<Page | undefined> {
  if (isObj(entry) && 'include' in entry) {
    if (typeof entry.include !== 'string') {
      r.error(file, 'include にはファイルのパスを書いてください')
      return undefined
    }
    const included = entry.include
    const text = await r.readFile(path.resolve(r.launcherDir, included))
    if (text === undefined) {
      r.error(file, `include 先がありません: ${included}`)
      return undefined
    }
    return readPage(r, parseYaml(text, included), included)
  }
  return readPage(r, entry, file)
}

function readPage(r: Reader, raw: unknown, file: string): Page | undefined {
  if (!isObj(raw)) {
    r.error(file, 'ページはキーと値の組で書いてください')
    return undefined
  }
  if (typeof raw.id !== 'string' || !PAGE_ID.test(raw.id)) {
    r.error(file, `ページ ID が正しくありません: ${String(raw.id)}（英数字と - _）`)
    return undefined
  }
  r.warnUnknown(raw, PAGE_KEYS, file, `ページ ${raw.id}`)
  const page: Page = {
    id: raw.id,
    title: r.str(raw, 'title', file),
    icon: r.str(raw, 'icon', file),
    cwd: r.str(raw, 'cwd', file),
    items: readItems(r, raw.items, file, `ページ ${raw.id} の items`)
  }
  if (raw.replace === true) page.replace = true
  return page
}
