import { itemLabel, resolveSelections } from '../core/items'
import { asItemRef, asNumber } from '../core/ipcArgs'
import { prepareRun, startRun } from '../core/runner'
import { handle } from './ipc'
import { findItem, ITEM_NOT_FOUND } from './project'
import type { SessionOf } from './session'
import { shellPathReady } from './shellPath'

let nextId = 1

/**
 * 実行の IPC を登録する。画面からはページ ID と項目の位置だけを受け取り、
 * 実行するスクリプトはメインで読んだ設定から取り出す。
 * 実行中のプロセスはウィンドウのセッションが持ち、閉じたときに止める
 */
export function registerRunHandlers(sessionOf: SessionOf): void {
  handle('run', async (e, pageIdArg, pathArg, select) => {
    await shellPathReady()
    const ref = asItemRef(pageIdArg, pathArg, select)
    const session = sessionOf(e.sender)
    const found = ref && findItem(session?.view, ref.pageId, ref.path)
    if (!session || !ref || !found) return { error: ITEM_NOT_FOUND }
    const { pageId, path } = ref
    const { project, launcherDir, page, item } = found
    const values = resolveSelections(project, ref.select)
    const req = prepareRun(project, page, item, launcherDir, process.env, process.platform, values)
    if (typeof req === 'string') return { error: req }

    const runId = nextId++
    const label = itemLabel(item, process.platform)
    const send = session.sendRun.bind(session)
    send({
      type: 'start',
      runId,
      label,
      pageId,
      path,
      kind: req.kind,
      cwd: req.cwd,
      script: req.script
    })
    for (const text of req.warnings)
      send({ type: 'output', runId, stream: 'stderr', lines: [text] })
    try {
      const handle = await startRun(req, (stream, lines) =>
        send({ type: 'output', runId, stream, lines })
      )
      session.runs.set(runId, handle)
      handle.done
        .then((r) => send({ type: 'exit', runId, label, ...r }))
        .catch((err: Error) =>
          send({ type: 'exit', runId, label, code: null, signal: null, error: err.message })
        )
        .finally(() => session.runs.delete(runId))
      return { runId }
    } catch (err) {
      return { error: (err as Error).message }
    }
  })

  handle('stop', (e, runId) => {
    const id = asNumber(runId)
    if (id !== undefined) sessionOf(e.sender)?.runs.get(id)?.stop()
  })
}
