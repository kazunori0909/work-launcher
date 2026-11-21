import { execFile } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { shell } from 'electron'
import type { ActionResult } from '../core/ipc'
import { buildUrl } from '../core/items'
import { officeLaunch } from '../core/office'
import { checkExternalUrl } from '../core/schemes'
import type { OfficeKind } from '../core/office'
import { expandVariables, resolveConfigPath } from '../core/variables'
import type { VariableContext } from '../core/variables'
import { openFolderOnMac } from './openFolder'
import { t } from '../core/i18n'

// ファイル・フォルダ・URL・Office を開く（ボタン・リンク・scripts.js の ctx から使う）

type Result = ActionResult

const expand = (text: string, ctx: VariableContext): string => expandVariables(text, ctx).value

/** ランチャーの設定まわりのパス（scripts など）を絶対パスにする。相対は launcherDir 起点 */
export const resolvePath = (p: string, ctx: VariableContext): string =>
  resolveConfigPath(expand(p, ctx), ctx.launcherDir)

/** 案件のファイルのパス（open・Office）を絶対パスにする。相対は workDir 起点 */
export const resolveFilePath = (p: string, ctx: VariableContext): string =>
  resolveConfigPath(expand(p, ctx), ctx.workDir ?? ctx.launcherDir)

export async function openPath(p: string, ctx: VariableContext): Promise<Result> {
  return openAbsolute(resolveFilePath(p, ctx))
}

/** 絶対パスのファイル・フォルダを OS の既定アプリで開く（Mac のフォルダは Finder） */
export async function openAbsolute(target: string): Promise<Result> {
  if (!existsSync(target)) return { error: t().open.notFound(target) }
  const error =
    process.platform === 'darwin' && statSync(target).isDirectory()
      ? await openFolderOnMac(target)
      : await shell.openPath(target)
  return error ? { error } : {}
}

const run = promisify(execFile)

export async function openOffice(
  kind: OfficeKind,
  p: string,
  readonly: boolean,
  ctx: VariableContext
): Promise<Result> {
  const target = resolveFilePath(p, ctx)
  if (!existsSync(target)) return { error: t().open.notFound(target) }
  const launch = officeLaunch(kind, target, readonly, process.platform)
  try {
    await run(launch.command, launch.args, {
      env: { ...process.env, ...launch.env },
      windowsHide: true,
      timeout: 60_000
    })
    return {}
  } catch (e) {
    if (launch.fallbackToDefault) {
      const error = await shell.openPath(target)
      return error ? { error } : {}
    }
    const stderr = (e as { stderr?: string }).stderr?.trim()
    return { error: t().open.failed(stderr || (e as Error).message) }
  }
}

/**
 * URL を外部に開く。リンク・url 項目・ctx.url のどれもここを通す。
 * schemes（config.yaml の openSchemes。省略時は既定）に無いスキームは開かない。file: はパスにして開く
 */
export async function openExternal(url: string, schemes?: readonly string[]): Promise<Result> {
  const target = checkExternalUrl(url, schemes)
  switch (target.type) {
    case 'url':
      await shell.openExternal(target.url)
      return {}
    case 'file': {
      let file: string
      try {
        file = fileURLToPath(target.url)
      } catch {
        return { error: t().open.badFileUrl(url) }
      }
      return openAbsolute(file)
    }
    case 'invalid':
      return { error: target.reason }
  }
}

export async function openUrl(
  url: string,
  params: Record<string, string> | undefined,
  ctx: VariableContext,
  schemes: readonly string[] | undefined
): Promise<Result> {
  let built: string
  try {
    const expanded = Object.entries(params ?? {}).map(([k, v]) => [k, expand(v, ctx)])
    built = buildUrl(expand(url, ctx), Object.fromEntries(expanded))
  } catch {
    return { error: t().open.badUrl(url) }
  }
  return openExternal(built, schemes)
}
