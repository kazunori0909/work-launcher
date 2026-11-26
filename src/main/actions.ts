import { writeFile } from 'node:fs/promises'
import path from 'node:path'
import { BrowserWindow, dialog } from 'electron'
import type { MessageBoxOptions } from 'electron'
import { resolveSelections } from '../core/items'
import { LOCAL_FILE } from '../core/load'
import { localConfigTemplate } from '../core/localTemplate'
import { asItemRef } from '../core/ipcArgs'
import { assertNever } from '../core/types'
import { variableContext } from '../core/variables'
import { handle } from './ipc'
import { changeItemState } from './itemState'
import { openOffice, openPath, openUrl } from './open'
import { findItem } from './project'
import { callFunction } from './scriptCall'
import type { SessionOf } from './session'
import { t } from '../core/i18n'

/** 実行系以外の項目の IPC を登録する。失敗したときだけ理由を返す */
export function registerActionHandlers(sessionOf: SessionOf): void {
  // ヘルプの「案件フォルダを開く」
  handle('openProjectFolder', async (e) => {
    const dir = sessionOf(e.sender)?.view?.launcherDir
    return dir ? openPath(dir, { launcherDir: dir, env: process.env }) : { error: t().noProject }
  })

  // ヘルプの「config.local.yaml を作る」。上書きの事故を避けるため、既にあれば作らない。
  // 作れたとき・既にあるときはポップアップで知らせ、それ以外の失敗はコンソールに出す
  handle('createLocalConfig', async (e) => {
    const view = sessionOf(e.sender)?.view
    if (!view?.launcherDir) return { error: t().noProject }
    if (!view.project) return { error: t().local.noConfig }
    const file = path.join(view.launcherDir, LOCAL_FILE)
    const popup = (options: MessageBoxOptions): Promise<unknown> => {
      const window = BrowserWindow.fromWebContents(e.sender)
      return window ? dialog.showMessageBox(window, options) : dialog.showMessageBox(options)
    }
    try {
      await writeFile(file, localConfigTemplate(view.project), { flag: 'wx' })
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== 'EEXIST') {
        return { error: t().local.cannotCreate(LOCAL_FILE, (err as Error).message) }
      }
      await popup({
        type: 'warning',
        message: t().local.exists(LOCAL_FILE),
        detail: `${file}\n\n${t().local.existsDetail}`
      })
      return {}
    }
    await popup({
      type: 'info',
      message: t().local.created(LOCAL_FILE),
      detail: `${file}\n\n${t().local.createdDetail}`
    })
    return {}
  })

  handle('activate', async (e, pageId, path, select) => {
    const ref = asItemRef(pageId, path, select)
    const session = sessionOf(e.sender)
    const found = ref && findItem(session?.view, ref.pageId, ref.path)
    if (!session || !ref || !found) return { error: t().run.itemNotFound }
    const { item, page, project, launcherDir } = found
    const ctx = {
      ...variableContext(project, launcherDir, process.env, page, item),
      select: resolveSelections(project, ref.select)
    }
    switch (item.kind) {
      case 'open':
        return openPath(item.path, ctx)
      case 'url':
        return openUrl(item.url, item.params, ctx, project.openSchemes)
      case 'function':
        return callFunction(item.fn, project.scripts, ctx, session)
      case 'reset': {
        const { error } = changeItemState(session, { action: 'reset', ids: item.ids })
        return error ? { error } : {}
      }
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
      case 'details':
      case 'alert':
      case 'image':
      case 'buttons':
      case 'select':
      case 'break':
      case 'heading':
      case 'error':
        return { error: t().run.notYet }
      default:
        return assertNever(item)
    }
  })
}
