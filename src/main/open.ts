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

// osascript（JavaScript）で動かす。Finder を前面に出さずにフォルダを開き、開いたウィンドウが
// 現れる（一番手前が変わる・新しい番号が増える）のを待ってから、Finder の主ウィンドウだけを前面に出す。
// プロセスの起動を1回で済ませるため、すべてこの中で行う
const OPEN_FOLDER_SCRIPT = `
ObjC.import('AppKit')
ObjC.import('CoreGraphics')

function finderWindows(pid) {
  const list = ObjC.castRefToObject(
    $.CGWindowListCopyWindowInfo($.kCGWindowListOptionOnScreenOnly | $.kCGWindowListExcludeDesktopElements, 0)
  )
  const ids = []
  for (let i = 0; i < list.count; i++) {
    const w = list.objectAtIndex(i)
    if (ObjC.unwrap(w.objectForKey('kCGWindowOwnerPID')) === pid && ObjC.unwrap(w.objectForKey('kCGWindowLayer')) === 0) {
      ids.push(ObjC.unwrap(w.objectForKey('kCGWindowNumber')))
    }
  }
  return ids
}

function run(argv) {
  const finder = $.NSRunningApplication.runningApplicationsWithBundleIdentifier('com.apple.finder').firstObject
  const before = finder ? finderWindows(finder.processIdentifier) : []
  const opened = $.NSWorkspace.sharedWorkspace.openURLsWithAppBundleIdentifierOptionsAdditionalEventParamDescriptorLaunchIdentifiers(
    $([$.NSURL.fileURLWithPath(argv[0])]),
    'com.apple.finder',
    $.NSWorkspaceLaunchWithoutActivation,
    $.NSAppleEventDescriptor.nullDescriptor,
    null
  )
  if (!opened) throw new Error('Finder で開けませんでした')
  if (!finder) return
  for (let i = 0; i < 50; i++) {
    const now = finderWindows(finder.processIdentifier)
    if (now[0] !== before[0] || now.some((id) => !before.includes(id))) break
    delay(0.02)
  }
  finder.activateWithOptions(0)
}
`

/**
 * Mac でフォルダを開き、そのウィンドウだけを前面に出す。普通に開くと Finder が丸ごと前面に来て、
 * ほかの Finder ウィンドウも前に出るため（経緯と実測は docs/archive/phase2-minimal-app/KNOWLEDGE.md）
 */
async function openFolderOnMac(folder: string): Promise<string | undefined> {
  try {
    await run('osascript', ['-l', 'JavaScript', '-e', OPEN_FOLDER_SCRIPT, folder])
    return undefined
  } catch (e) {
    return (e as Error).message
  }
}
