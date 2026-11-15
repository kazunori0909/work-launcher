import { variableContext } from '../core/variables'
import { send } from './ipc'
import { callFunction } from './scriptCall'
import type { WindowSession } from './session'

// 案件を開く・閉じるときに、scripts の決まった名前の関数を呼ぶ（仕様は docs/config.md 10章）

export type LifecycleEvent = 'beforeOpen' | 'afterOpen' | 'beforeClose'

/** 閉じるのを待ち始めてから、画面に「待たずに閉じる」を出すまで（すぐ終わるときに画面がちらつかないように） */
const SHOW_CLOSING_AFTER_MS = 500

/** イベントの関数を呼ぶ。無ければ何もしない。失敗はコンソールに出す */
export async function callEvent(name: LifecycleEvent, session: WindowSession): Promise<void> {
  const project = session.view?.project
  const launcherDir = session.view?.launcherDir
  if (!project || !launcherDir) return
  const ctx = { ...variableContext(project, launcherDir, process.env), select: session.select }
  const result = await callFunction(name, project.scripts, ctx, session, { event: true })
  if (result.error) {
    session.sendRun({ type: 'message', level: 'error', text: `■ ${name}: ${result.error}` })
  }
}

/**
 * 閉じる前に beforeClose を呼び、終わるのを待つ。待つ間は画面に「待たずに閉じる」を出す。
 * 何度呼んでも beforeClose は1回だけ呼ぶ
 */
export function prepareClose(session: WindowSession): Promise<void> {
  if (session.closeReady) return Promise.resolve()
  session.closing ??= (async () => {
    const timer = setTimeout(
      () => send(session.contents, 'project:closing', undefined),
      SHOW_CLOSING_AFTER_MS
    )
    try {
      if (session.openedDir) await callEvent('beforeClose', session)
    } finally {
      clearTimeout(timer)
      session.closeReady = true
    }
  })()
  return session.closing
}
