import { execFile } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { promisify } from 'node:util'
import { shell } from 'electron'
import type { ActionResult } from '../core/ipc'
import { buildUrl } from '../core/items'
import { officeLaunch } from '../core/office'
import type { OfficeKind } from '../core/office'
import { expandVariables, resolveConfigPath } from '../core/variables'
import type { VariableContext } from '../core/variables'
import { openFolderOnMac } from './openFolder'

// ファイル・フォルダ・URL・Office を開く（ボタン・リンク・scripts.js の ctx.open から使う）

type Result = ActionResult

const expand = (text: string, ctx: VariableContext): string => expandVariables(text, ctx).value

/** 設定に書いたパスを絶対パスにする（変数を置き換え、相対は launcherDir 起点） */
export const resolvePath = (p: string, ctx: VariableContext): string =>
  resolveConfigPath(expand(p, ctx), ctx.launcherDir)

export async function openPath(p: string, ctx: VariableContext): Promise<Result> {
  const target = resolvePath(p, ctx)
  if (!existsSync(target)) return { error: `見つかりません: ${target}` }
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
  const target = resolvePath(p, ctx)
  if (!existsSync(target)) return { error: `見つかりません: ${target}` }
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
    return { error: `開けませんでした: ${stderr || (e as Error).message}` }
  }
}

export async function openUrl(
  url: string,
  params: Record<string, string> | undefined,
  ctx: VariableContext
): Promise<Result> {
  let built: string
  try {
    const expanded = Object.entries(params ?? {}).map(([k, v]) => [k, expand(v, ctx)])
    built = buildUrl(expand(url, ctx), Object.fromEntries(expanded))
  } catch {
    return { error: `URL が正しくありません: ${url}` }
  }
  await shell.openExternal(built)
  return {}
}
