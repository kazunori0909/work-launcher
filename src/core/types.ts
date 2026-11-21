// 設定ファイルを読み込んで正規化したあとの形（仕様は docs/config.md）
import type { ConsoleRule } from './console'
import type { Lang } from './i18n'

export const EXEC_KINDS = ['bat', 'sh', 'powershell', 'python'] as const
export type ExecKind = (typeof EXEC_KINDS)[number]

export interface ItemCommon {
  id?: string
  label?: string
  icon?: string
  tooltip?: string
  confirm?: string
}

export type Item =
  | (ItemCommon & { kind: 'function'; fn: string })
  | (ItemCommon & { kind: 'excel' | 'powerpoint' | 'word'; path: string; readonly: boolean })
  | (ItemCommon & { kind: 'open'; path: string })
  | (ItemCommon & {
      kind: 'exec'
      scripts: Partial<Record<ExecKind, string>>
      cwd?: string
      env?: Record<string, string>
      encoding?: string
    })
  | (ItemCommon & { kind: 'html' | 'markdown'; content: string })
  | (ItemCommon & { kind: 'mdfile'; path: string })
  | (ItemCommon & { kind: 'url'; url: string; params?: Record<string, string> })
  | { kind: 'group'; id?: string; icon?: string; title?: string; items: Item[] }
  | { kind: 'buttons'; id?: string; items: Item[] }
  | (ItemCommon & {
      kind: 'select'
      /** select の ID。`${select:ID}` で参照する（id と同じ値） */
      name: string
      /** 画面での出し方。radio・checkbox も値の扱いは select と同じ（checkbox は on・off の2択） */
      control: SelectControl
      options: SelectOption[]
      default?: string
      remember: boolean
      /** 画面で値を変えたときに呼ぶ関数（scripts の関数名） */
      change?: string
    })
  | { kind: 'break'; id?: string }
  | { kind: 'heading'; id?: string; text: string }
  | { kind: 'error'; id?: string; message: string }

/** switch で全部の種類を書いたことを型で確かめる（種類を足すと、ここがコンパイルエラーになる） */
export function assertNever(value: never): never {
  throw new Error(`想定していない値です: ${JSON.stringify(value)}`)
}

/** select と同じ扱いになる種類キー */
export const SELECT_CONTROLS = ['select', 'radio', 'checkbox'] as const
export type SelectControl = (typeof SELECT_CONTROLS)[number]

export interface SelectOption {
  label: string
  value: string
}

/** 子の項目を持つ項目 */
export type ItemContainer = Extract<Item, { items: Item[] }>

/** ボタングループの中に置ける項目の種類 */
export const BUTTON_KINDS = [
  'function',
  'excel',
  'powerpoint',
  'word',
  'open',
  'exec',
  'url'
] as const

export interface Page {
  id: string
  title?: string
  icon?: string
  cwd?: string
  items: Item[]
  /** ローカル設定でだけ意味を持つ。合成後は残らない */
  replace?: boolean
}

export interface InfoTool {
  name: string
  command?: string
  pattern?: string
  /** 同じ名前のツールを Info に出さない（ローカル設定で案件のツールを消すときに書く） */
  hidden?: boolean
}

/** 表示するレジストリの値（Windows だけ） */
export interface InfoRegistry {
  name: string
  /** `HKLM\キー\値の名前`。`\` で終われば既定値 */
  path: string
}

export interface InfoConfig {
  /** 未指定は true として扱う */
  drives?: boolean
  env: string[]
  tools: InfoTool[]
  registry: InfoRegistry[]
}

export interface Project {
  title?: string
  cwd?: string
  /** 当てる CSS ファイル（未展開のパス）。案件 → ローカルの順 */
  styles: string[]
  /** function で読み込む JS（未展開のパス。フォルダなら中の .js すべて）。案件 → ローカルの順 */
  scripts: string[]
  /** 外部に開いてよい URL のスキーム（正規化済み）。省略時は DEFAULT_OPEN_SCHEMES（core/schemes.ts） */
  openSchemes?: string[]
  pages: Page[]
  info: InfoConfig
}

export interface Diagnostic {
  level: 'error' | 'warning'
  file: string
  line?: number
  message: string
}

/** mdfile で読んだ md */
export interface MarkdownFile {
  /** launcherDir からの相対パス（`/` 区切り）。案件フォルダの外なら undefined */
  path?: string
  /** ファイルが無ければ undefined */
  text?: string
}

/** メインプロセスから画面に渡す、読み込み結果 */
export interface ProjectView {
  launcherDir?: string
  /** 最上位の cwd から決めた作業フォルダ（ヘルプに値を出す） */
  workDir?: string
  platform: string
  project?: Project
  /** styles を読んだ中身 */
  css: string[]
  consoleRules: ConsoleRule[]
  /** WorkLauncher のバージョン（ヘッダーの右端に出す） */
  appVersion?: string
  /** 表示の言語（メインが決め、画面はこれに合わせる） */
  lang?: Lang
  /** remember: true の select で記憶している値（ID → 値。アプリのユーザーデータから読む） */
  remembered?: Record<string, string>
  /** mdfile に書いたパス（未展開）ごとの中身 */
  mdfiles: Record<string, MarkdownFile>
  diagnostics: Diagnostic[]
}

/** アプリに入っているサードパーティのライブラリ（scripts/licenses.mjs がビルド時に集める） */
export interface ThirdPartyLicense {
  name: string
  version: string
  /** package.json の license（SPDX の式） */
  license: string
  /** LICENSE ファイルの本文。無ければ空 */
  text: string
}
