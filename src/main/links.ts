import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { net, protocol } from 'electron'
import type { Session } from 'electron'
import { asString } from '../core/ipcArgs'
import { FILE_SCHEME, pathFromFileUrl, resolveLink } from '../core/markdown'
import { assertNever } from '../core/types'
import type { ProjectView } from '../core/types'
import { openAbsolute, openExternal } from './open'
import { handle } from './ipc'
import type { ViewOf } from './project'

/** app の ready より前に呼ぶ */
export function registerFileScheme(): void {
  protocol.registerSchemesAsPrivileged([
    { scheme: FILE_SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } }
  ])
}

/**
 * md・html の画像を画面に渡す。案件フォルダの中のファイルだけを返す
 * （パスは launcherDir からの相対で受け取り、`..` で外に出られないようにしてある）。
 * ウィンドウごとのセッションに登録する
 */
export function handleFileScheme(ses: Session, currentView: () => ProjectView | undefined): void {
  ses.protocol.handle(FILE_SCHEME, (request) => {
    const launcherDir = currentView()?.launcherDir
    const rel = pathFromFileUrl(request.url)
    if (!launcherDir || !rel) return new Response(null, { status: 404 })
    const abs = path.resolve(launcherDir, rel)
    if (!abs.startsWith(launcherDir + path.sep)) return new Response(null, { status: 403 })
    return net.fetch(pathToFileURL(abs).toString()).catch(() => new Response(null, { status: 404 }))
  })
}

/** md・html のリンクを開く。外部 URL は openSchemes で確かめて開き、ファイルは OS の既定アプリ */
export function registerLinkHandlers(viewOf: ViewOf): void {
  handle('openLink', async (e, hrefArg, baseDirArg) => {
    const href = asString(hrefArg)
    const baseDir = asString(baseDirArg)
    if (href === undefined || baseDir === undefined) return { error: 'リンクが正しくありません' }
    const target = resolveLink(href, baseDir)
    const view = viewOf(e.sender)
    switch (target.type) {
      case 'external':
        return openExternal(target.url, view?.project?.openSchemes)
      // md のリンクは launcherDir 起点（resolveLink が launcherDir からの相対にしてある）
      case 'file':
        if (!view?.launcherDir) return { error: '案件が開かれていません' }
        return openAbsolute(path.join(view.launcherDir, target.path))
      // ページ内のリンクは画面で動かす
      case 'anchor':
        return {}
      default:
        return assertNever(target)
    }
  })
}
