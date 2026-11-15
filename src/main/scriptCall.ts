import { existsSync } from 'node:fs'
import path from 'node:path'
import { utilityProcess } from 'electron'
import type { ActionResult } from '../core/ipc'
import { DEFAULT_SCRIPTS } from '../core/load'
import { listScriptFiles } from '../core/scripts'
import type { VariableContext } from '../core/variables'
import { openPath, openUrl, resolvePath } from './open'
import type { CallRequest, HostMessage, SelectChange } from './scriptHost'
import type { WindowSession } from './session'
import { shellPathReady } from './shellPath'
import { ensureTrusted } from './trust'

type Result = ActionResult

export interface CallOptions {
  /**
   * イベント（beforeOpen など）として呼ぶ。関数・JS が無い、実行を許可しなかったときは、何もせず {} を返す。
   * 許可しなかったことはセッションに覚え、その案件を開いている間は聞き直さない
   */
  event?: boolean
  /** change で呼ぶとき、変えた項目（ctx.changed） */
  changed?: SelectChange
}

/** scripts に並べた JS の関数を別プロセスで呼ぶ。log・open などの依頼を中継する */
export async function callFunction(
  fn: string,
  scripts: string[],
  ctx: VariableContext,
  session: WindowSession,
  { event = false, changed }: CallOptions = {}
): Promise<Result> {
  const { launcherDir, workDir = launcherDir, select = {} } = ctx
  const listed = listScriptFiles(scripts.map((s) => resolvePath(s, ctx)))
  if ('missing' in listed) {
    // 省略時の launcher/scripts が無いだけなら、イベントは黙って呼ばない
    if (event && listed.missing === resolvePath(DEFAULT_SCRIPTS[0], ctx)) return {}
    return { error: `scripts のファイルがありません: ${listed.missing}` }
  }
  const { files } = listed
  if (files.length === 0) return event ? {} : { error: 'scripts に JS ファイルがありません' }
  if (event && session.scriptsDeclined) return {}
  await shellPathReady()
  if (!existsSync(workDir)) return { error: `作業フォルダがありません: ${workDir}` }
  if (!(await ensureTrusted(launcherDir, session.window))) {
    if (event) {
      session.scriptsDeclined = true
      return {}
    }
    return { error: 'JS（scripts）の実行を許可しませんでした' }
  }
  const report = (r: Result): void => {
    if (r.error) session.sendRun({ type: 'message', level: 'error', text: r.error })
  }

  const child = utilityProcess.fork(path.join(__dirname, 'scriptHost.js'), [], {
    cwd: workDir,
    serviceName: 'WorkLauncher scripts.js'
  })
  // ウィンドウを閉じたら、セッションが止める
  session.scripts.add(child)
  return new Promise((resolve) => {
    let finished = false
    const finish = (r: Result): void => {
      if (finished) return
      finished = true
      session.scripts.delete(child)
      child.kill()
      resolve(r)
    }
    child.on('message', (m: HostMessage) => {
      if (m.type === 'log') session.sendRun({ type: 'message', level: 'info', text: m.text })
      else if (m.type === 'open') openPath(m.path, ctx).then(report)
      else if (m.type === 'openUrl')
        openUrl(m.url, m.params, ctx, session.view?.project?.openSchemes).then(report)
      else if (m.type === 'done') finish({})
      else finish({ error: m.message })
    })
    child.on('exit', (code) =>
      finish(code === 0 ? {} : { error: `scripts.js が終了しました（コード ${code}）` })
    )
    child.postMessage({
      files,
      fn,
      launcherDir,
      workDir,
      select,
      optional: event,
      changed
    } satisfies CallRequest)
  })
}
