import path from 'node:path'
import type { Item, Page, Project } from './types'

export interface VariableContext {
  /** work.launcher があるフォルダ。設定に書く相対パスの起点 */
  launcherDir: string
  /** 作業フォルダ（cwd を引き継いだ結果）。cwd そのものを展開するときは無い */
  workDir?: string
  env: Record<string, string | undefined>
  /** select の値（ID → 値）。無ければ `${select:ID}` を置き換えずに残す */
  select?: Record<string, string>
}

export interface Expanded {
  value: string
  /** 定義されていなかった環境変数の名前（空文字に置き換えた） */
  missingEnv: string[]
  /** 案件に無い select の ID（空文字に置き換えた） */
  missingSelect: string[]
}

// `${launcherDir}`・`${workDir}`・`${env:NAME}`・`${select:ID}` だけを置き換える。先頭の `$` を重ねたものはエスケープ
const VARIABLE = /(\$?)\$\{(launcherDir|workDir|env:([^}]+)|select:([^}]+))\}/g

export function expandVariables(text: string, ctx: VariableContext): Expanded {
  const missingEnv: string[] = []
  const missingSelect: string[] = []
  const replace = (
    match: string,
    escape: string,
    name: string,
    envName?: string,
    selectName?: string
  ): string => {
    if (escape) return match.slice(1)
    if (selectName !== undefined) {
      // cwd・md・style など、選択と時機が合わない所では置き換えずに残す
      if (!ctx.select) return match
      const v = ctx.select[selectName]
      if (v === undefined) missingSelect.push(selectName)
      return v ?? ''
    }
    if (name === 'launcherDir') return ctx.launcherDir
    // cwd の中では作業フォルダがまだ決まっていないので、置き換えずに残す
    if (name === 'workDir') return ctx.workDir ?? match
    const v = ctx.env[envName!]
    if (v === undefined) {
      missingEnv.push(envName!)
      return ''
    }
    return v
  }
  return { value: text.replace(VARIABLE, replace), missingEnv, missingSelect }
}

/** 設定に書いたパス（変数置き換え済み）を絶対パスにする。相対パスは base（launcherDir か workDir）起点 */
export function resolveConfigPath(
  p: string,
  base: string,
  platform: NodeJS.Platform = process.platform
): string {
  if (platform === 'win32') return path.win32.resolve(base, p)
  return path.posix.resolve(base, p.replaceAll('\\', '/'))
}

/** 作業フォルダ（未展開）。項目（実行系のみ）→ ページ → 最上位の順に引き継ぐ */
export function effectiveCwd(project: Project, page?: Page, item?: Item): string | undefined {
  const own = item?.kind === 'exec' ? item.cwd : undefined
  return own ?? page?.cwd ?? project.cwd
}

/** 作業フォルダの絶対パス。書かれていなければ launcherDir */
export function resolveWorkDir(
  cwd: string | undefined,
  launcherDir: string,
  env: VariableContext['env'],
  platform: NodeJS.Platform = process.platform
): { dir: string; missingEnv: string[] } {
  const r = expandVariables(cwd ?? '.', { launcherDir, env })
  return { dir: resolveConfigPath(r.value, launcherDir, platform), missingEnv: r.missingEnv }
}

/** 項目・ページ・最上位の設定から、変数の置き換えに使う値を作る（page・item を省けば最上位の cwd） */
export function variableContext(
  project: Project,
  launcherDir: string,
  env: VariableContext['env'],
  page?: Page,
  item?: Item,
  platform: NodeJS.Platform = process.platform
): VariableContext {
  const workDir = resolveWorkDir(effectiveCwd(project, page, item), launcherDir, env, platform).dir
  return { launcherDir, workDir, env }
}
