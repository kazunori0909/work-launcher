import { selectItems, walkItems } from '../core/items'
import { asSelect, asString } from '../core/ipcArgs'
import type { Page, Project } from '../core/types'
import { variableContext } from '../core/variables'
import { handle } from './ipc'
import { remember } from './remembered'
import { callFunction } from './scriptCall'
import type { SessionOf } from './session'

/**
 * この change を書いた、その ID の select・radio・checkbox があるページ（画面から来た関数名を確かめる）。
 * 関数はそのページの cwd で動かす（function の項目と同じ）
 */
function pageWithChange(project: Project, name: string, change: string): Page | undefined {
  return project.pages.find((page) =>
    walkItems(page.items).some(
      (item) => item.kind === 'select' && item.name === name && item.change === change
    )
  )
}

/**
 * select の値を変えた IPC。値をセッションに持ち、remember: true なら記憶し、change があれば関数を呼ぶ。
 * change は前の change が終わってから順に呼ぶ
 */
export function registerSelectionHandlers(sessionOf: SessionOf): void {
  handle('changeSelection', async (e, nameArg, valueArg, changeArg, selectArg) => {
    const session = sessionOf(e.sender)
    const project = session?.view?.project
    const launcherDir = session?.view?.launcherDir
    const name = asString(nameArg)
    const value = asString(valueArg)
    const item = project && name !== undefined ? selectItems(project).get(name) : undefined
    if (!session || !project || !launcherDir || name === undefined || value === undefined) return {}
    if (!item) return {}
    if (!item.options.some((o) => o.value === value)) return {}

    const previous = session.select[name] ?? ''
    const select = { ...session.select, ...asSelect(selectArg), [name]: value }
    session.select = select
    if (item.remember) remember(launcherDir, name, value)

    const change = asString(changeArg)
    const page = change !== undefined ? pageWithChange(project, name, change) : undefined
    if (change === undefined || !page) return {}
    const ctx = { ...variableContext(project, launcherDir, process.env, page), select }
    const call = session.changeQueue.then(() =>
      callFunction(change, project.scripts, ctx, session, {
        changed: { id: name, value, previous }
      })
    )
    session.changeQueue = call.catch(() => {})
    return call
  })
}
