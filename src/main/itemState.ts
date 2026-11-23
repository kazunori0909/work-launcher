import type { CtxCall, CtxResult } from '../core/ctxCalls'
import { changeDisabled, resetValues, selectValue } from '../core/itemState'
import { t } from '../core/i18n'
import { remember } from './remembered'
import type { WindowSession } from './session'

/** 関数から頼まれた、項目の状態の変更。セッションを変えて画面に送る。set・reset は変えた値を返す */
export function changeItemState(
  session: WindowSession,
  call: Extract<CtxCall, { action: 'set' | 'enable' | 'disable' | 'reset' }>
): CtxResult {
  const project = session.view?.project
  const launcherDir = session.view?.launcherDir
  if (!project || !launcherDir) return { error: t().noProject }
  if (call.action === 'set') {
    const r = selectValue(project, call.id, call.value)
    if ('error' in r) return { error: `ctx.set: ${r.error}` }
    session.select = { ...session.select, [call.id]: r.value }
    if (r.remember) remember(launcherDir, call.id, r.value)
    session.sendState()
    return { select: { [call.id]: r.value } }
  }
  if (call.action === 'reset') {
    const r = resetValues(project, call.ids)
    if ('error' in r) return { error: `ctx.reset: ${r.error}` }
    session.select = { ...session.select, ...r.select }
    for (const name of r.remember) remember(launcherDir, name, r.select[name])
    session.sendState()
    return { select: r.select }
  }
  const r = changeDisabled(project, session.disabled, call.ids, call.action === 'enable')
  if ('error' in r) return { error: `ctx.${call.action}: ${r.error}` }
  session.disabled = r.disabled
  session.sendState()
  return {}
}
