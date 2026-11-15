import { resolveSelections } from '../core/items'
import { asItemRef } from '../core/ipcArgs'
import { assertNever } from '../core/types'
import { variableContext } from '../core/variables'
import { handle } from './ipc'
import { openOffice, openPath, openUrl } from './open'
import { findItem, ITEM_NOT_FOUND } from './project'
import { callFunction } from './scriptCall'
import type { SessionOf } from './session'

/** 実行系以外の項目の IPC を登録する。失敗したときだけ理由を返す */
export function registerActionHandlers(sessionOf: SessionOf): void {
  // ヘルプの「案件フォルダを開く」
  handle('openProjectFolder', async (e) => {
    const dir = sessionOf(e.sender)?.view?.launcherDir
    return dir
      ? openPath(dir, { launcherDir: dir, env: process.env })
      : { error: '案件が開かれていません' }
  })

  handle('activate', async (e, pageId, path, select) => {
    const ref = asItemRef(pageId, path, select)
    const session = sessionOf(e.sender)
    const found = ref && findItem(session?.view, ref.pageId, ref.path)
    if (!session || !ref || !found) return { error: ITEM_NOT_FOUND }
    const { item, page, project, launcherDir } = found
    const ctx = {
      ...variableContext(project, launcherDir, process.env, page, item),
      select: resolveSelections(project, ref.select)
    }
    switch (item.kind) {
      case 'open':
        return openPath(item.path, ctx)
      case 'url':
        return openUrl(item.url, item.params, ctx)
      case 'function':
        return callFunction(item.fn, project.scripts, ctx, session)
      case 'excel':
      case 'powerpoint':
      case 'word':
        return openOffice(item.kind, item.path, item.readonly, ctx)
      // exec は run で動かす。ほかはボタンにならない
      case 'exec':
      case 'html':
      case 'markdown':
      case 'mdfile':
      case 'group':
      case 'buttons':
      case 'select':
      case 'break':
      case 'heading':
      case 'error':
        return { error: 'この項目はまだ動かせません' }
      default:
        return assertNever(item)
    }
  })
}
