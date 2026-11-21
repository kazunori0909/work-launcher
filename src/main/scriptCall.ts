import { existsSync } from 'node:fs'
import path from 'node:path'
import { utilityProcess } from 'electron'
import type { ActionResult } from '../core/ipc'
import { DEFAULT_SCRIPTS } from '../core/load'
import { listScriptFiles } from '../core/scripts'
import type { VariableContext } from '../core/variables'
import type { CtxCall, CtxResult } from '../core/ctxCalls'
import { openOffice, openPath, openUrl, resolvePath } from './open'
import { runFromFunction } from './runs'
import type { CallRequest, HostMessage, HostReply, SelectChange } from './scriptHost'
import type { WindowSession } from './session'
import { shellPathReady } from './shellPath'
import { ensureTrusted } from './trust'
import { getLang, t } from '../core/i18n'

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

/** scripts に並べた JS の関数を別プロセスで呼ぶ。log と、項目と同じ動作の依頼を受ける */
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
    return { error: t().script.fileMissing(listed.missing) }
  }
  const { files } = listed
  if (files.length === 0) return event ? {} : { error: t().script.noFiles }
  if (event && session.scriptsDeclined) return {}
  await shellPathReady()
  if (!existsSync(workDir)) return { error: t().run.noWorkDir(workDir) }
  if (!(await ensureTrusted(launcherDir, session.window))) {
    if (event) {
      session.scriptsDeclined = true
      return {}
    }
    return { error: t().script.denied }
  }
  /** 関数から頼まれた、項目と同じ動作 */
  const perform = async (call: CtxCall): Promise<CtxResult> => {
    const vars = { ...ctx, workDir, select }
    switch (call.action) {
      case 'open':
        return openPath(call.path, vars)
      case 'url':
        return openUrl(call.url, call.params, vars, session.view?.project?.openSchemes)
      case 'exec':
        return runFromFunction(session, call, vars)
      default:
        return openOffice(call.action, call.path, call.readonly, vars)
    }
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
      if (m.type === 'log') {
        session.sendRun({ type: 'message', level: m.level ?? 'info', text: m.text })
      } else if (m.type === 'call') {
        perform(m.call)
          .catch((err: unknown): CtxResult => ({ error: String(err) }))
          .then((result) => {
            if (!finished) child.postMessage({ id: m.id, result } satisfies HostReply)
          })
      } else if (m.type === 'done') finish({})
      else finish({ error: m.message })
    })
    child.on('exit', (code) => finish(code === 0 ? {} : { error: t().script.exited(String(code)) }))
    child.postMessage({
      files,
      fn,
      launcherDir,
      workDir,
      select,
      optional: event,
      changed,
      lang: getLang()
    } satisfies CallRequest)
  })
}
