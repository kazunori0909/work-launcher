import { itemLabel, resolveSelections } from '../core/items'
import { asItemRef, asNumber } from '../core/ipcArgs'
import type { CtxCall, CtxResult } from '../core/ctxCalls'
import { batchOutput } from '../core/outputBatch'
import { prepareRun, prepareScript, startRun } from '../core/runner'
import type { RunEvent } from '../core/ipc'
import type { RunHandle, RunRequest, Stream } from '../core/runner'
import { handle } from './ipc'
import { findItem } from './project'
import type { SessionOf, WindowSession } from './session'
import { shellPathReady } from './shellPath'
import { t } from '../core/i18n'

let nextId = 1

/** 画面へ出力を送る間隔（ms）。細かく出し続けるコマンドでも、画面の更新をこの回数に抑える */
const OUTPUT_INTERVAL = 50

interface StartOptions {
  /** 押した項目の位置（function から始めたときは無い） */
  at?: { pageId: string; path: number[] }
  /** コンソールに出さない（開始・出力・終了を画面に知らせない） */
  quiet?: boolean
  /** 出力を受け取る */
  onLines?(stream: Stream, lines: string[]): void
}

/** 実行を始め、開始・出力・終了を画面に知らせる。始められなければ例外にする */
export async function startSessionRun(
  session: WindowSession,
  req: RunRequest,
  label: string,
  { at, quiet = false, onLines }: StartOptions = {}
): Promise<{ runId: number; handle: RunHandle }> {
  const runId = nextId++
  const send = (event: RunEvent): void => {
    if (!quiet) session.sendRun(event)
  }
  send({ type: 'start', runId, label, ...at, kind: req.kind, cwd: req.cwd, script: req.script })
  for (const text of req.warnings) send({ type: 'output', runId, stream: 'stderr', lines: [text] })
  const output = batchOutput(
    (stream, lines) => send({ type: 'output', runId, stream, lines }),
    OUTPUT_INTERVAL
  )
  const handle = await startRun(req, (stream, lines) => {
    onLines?.(stream, lines)
    if (!quiet) output.push(stream, lines)
  })
  session.runs.set(runId, handle)
  handle.done
    .then((r) => {
      output.flush()
      send({ type: 'exit', runId, label, ...r })
    })
    .catch((err: Error) => {
      output.flush()
      send({ type: 'exit', runId, label, code: null, signal: null, error: err.message })
    })
    .finally(() => session.runs.delete(runId))
  return { runId, handle }
}

/** function から頼まれたスクリプトを動かす。call.wait なら終わるまで待ち、出力も返す */
export async function runFromFunction(
  session: WindowSession,
  call: Extract<CtxCall, { action: 'exec' }>,
  ctx: { launcherDir: string; workDir: string; select: Record<string, string> }
): Promise<CtxResult> {
  const req = prepareScript(call, {
    launcherDir: ctx.launcherDir,
    defaultDir: ctx.workDir,
    env: process.env,
    select: ctx.select
  })
  if (typeof req === 'string') return { error: req }
  const out: Record<Stream, string[]> = { stdout: [], stderr: [] }
  try {
    const label = call.script.trim().split('\n')[0]
    const { handle } = await startSessionRun(session, req, label, {
      quiet: !call.console,
      onLines: call.wait ? (stream, lines) => out[stream].push(...lines) : undefined
    })
    if (!call.wait) return {}
    const r = await handle.done
    if (r.error) return { error: r.error }
    return {
      code: r.code,
      signal: r.signal,
      stdout: out.stdout.join('\n'),
      stderr: out.stderr.join('\n')
    }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

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
    if (!session || !ref || !found) return { error: t().run.itemNotFound }
    const { pageId, path } = ref
    const { project, launcherDir, page, item } = found
    const values = resolveSelections(project, ref.select)
    const req = prepareRun(project, page, item, launcherDir, process.env, process.platform, values)
    if (typeof req === 'string') return { error: req }

    try {
      const label = itemLabel(item, process.platform)
      const { runId } = await startSessionRun(session, req, label, { at: { pageId, path } })
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
