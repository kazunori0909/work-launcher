import { existsSync } from 'node:fs'
import type { WebContents } from 'electron'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { itemAt, walkItems } from '../core/items'
import { loadConsoleRules, loadProject, PROJECT_FILE } from '../core/load'
import type { ReadFile } from '../core/load'
import type { Diagnostic, Item, MarkdownFile, Page, Project, ProjectView } from '../core/types'
import { expandVariables, resolveConfigPath, variableContext } from '../core/variables'
import { t } from '../core/i18n'

const readFileIfExists: ReadFile = async (p) => {
  try {
    return await readFile(p, 'utf8')
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return undefined
    throw e
  }
}

/**
 * 起動引数から案件フォルダを決める。`.launcher` ファイルか、それを含むフォルダを受け付ける。
 * 相対パスは cwd（既定はこのプロセスの作業フォルダ）から見る
 */
export function launcherDirFromArgs(args: string[], cwd = process.cwd()): string | undefined {
  for (const arg of args) {
    if (arg.startsWith('-')) continue
    const abs = path.resolve(cwd, arg)
    if (abs.endsWith('.launcher')) return path.dirname(abs)
    if (existsSync(path.join(abs, PROJECT_FILE))) return abs
  }
  return undefined
}

/** Windows のポータブル版か（一時フォルダに展開して動き、元の exe の置き場所が環境変数で渡る） */
export function isPortable(env: NodeJS.ProcessEnv): boolean {
  return !!env['PORTABLE_EXECUTABLE_DIR']
}

/**
 * アプリと同じフォルダに `work.launcher` があれば、そのフォルダを案件にする。
 * ポータブル版は一時フォルダに展開して動くため、元の exe の置き場所（PORTABLE_EXECUTABLE_DIR）を先に見る
 */
export function launcherDirNextToApp(execPath: string, env: NodeJS.ProcessEnv): string | undefined {
  const dirs = [env['PORTABLE_EXECUTABLE_DIR'], path.dirname(execPath)]
  return dirs.find((d): d is string => !!d && existsSync(path.join(d, PROJECT_FILE)))
}

/** IPC を送ってきたウィンドウで開いている案件を返す */
export type ViewOf = (sender: WebContents) => ProjectView | undefined

export interface LoadedProject {
  view: ProjectView
  /** 読もうとしたファイル（無かったものも含む）。変更の見張りに使う */
  files: string[]
}

export async function loadProjectView(launcherDir: string | undefined): Promise<LoadedProject> {
  const platform = process.platform
  // 案件が決まらなければ、画面は開始画面を出す
  if (!launcherDir) {
    return {
      view: { platform, css: [], consoleRules: [], mdfiles: {}, diagnostics: [] },
      files: []
    }
  }
  const files = new Set<string>()
  const read: ReadFile = (p) => {
    files.add(p)
    return readFileIfExists(p)
  }
  const { project, diagnostics } = await loadProject(launcherDir, read)
  const css = project ? await readStyles(project, launcherDir, read, diagnostics) : []
  const consoleRules = await loadConsoleRules(launcherDir, read)
  diagnostics.push(...consoleRules.diagnostics)
  const mdfiles = project ? await readMdfiles(project, launcherDir, read, diagnostics) : {}
  return {
    view: {
      launcherDir,
      workDir: project && variableContext(project, launcherDir, process.env).workDir,
      platform,
      project,
      css,
      consoleRules: consoleRules.rules,
      mdfiles,
      diagnostics
    },
    files: [...files]
  }
}

/** launcherDir からの相対パス（`/` 区切り）。案件フォルダの外なら undefined */
function relativePath(abs: string, launcherDir: string): string | undefined {
  const rel = path.relative(launcherDir, abs)
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return undefined
  return rel.split(path.sep).join('/')
}

async function readMdfiles(
  project: Project,
  launcherDir: string,
  read: ReadFile,
  diagnostics: Diagnostic[]
): Promise<Record<string, MarkdownFile>> {
  const mdfiles: Record<string, MarkdownFile> = {}
  for (const page of project.pages) {
    for (const item of walkItems(page.items)) {
      if (item.kind !== 'mdfile' || item.path in mdfiles) continue
      const ctx = variableContext(project, launcherDir, process.env, page, item)
      const { value } = expandVariables(item.path, ctx)
      const abs = resolveConfigPath(value, launcherDir)
      const text = await read(abs)
      if (text === undefined) {
        diagnostics.push({
          level: 'warning',
          file: t().load.page(page.id),
          message: t().load.mdMissing(item.path)
        })
      }
      mdfiles[item.path] = { path: relativePath(abs, launcherDir), text }
    }
  }
  return mdfiles
}

async function readStyles(
  project: Project,
  launcherDir: string,
  read: ReadFile,
  diagnostics: Diagnostic[]
): Promise<string[]> {
  const css: string[] = []
  for (const style of project.styles) {
    const { value } = expandVariables(style, variableContext(project, launcherDir, process.env))
    const text = await read(resolveConfigPath(value, launcherDir))
    if (text === undefined) {
      diagnostics.push({ level: 'warning', file: style, message: t().load.styleMissing })
    } else {
      css.push(text)
    }
  }
  return css
}

/** 画面から受け取ったページ ID と位置の並びで、メインが読んだ設定の項目を探す */
export function findItem(
  view: ProjectView | undefined,
  pageId: string,
  path: number[]
): { project: Project; launcherDir: string; page: Page; item: Item } | undefined {
  const page = view?.project?.pages.find((p) => p.id === pageId)
  const item = page && Array.isArray(path) ? itemAt(page.items, path) : undefined
  if (!view?.project || !view.launcherDir || !page || !item) return undefined
  return { project: view.project, launcherDir: view.launcherDir, page, item }
}
