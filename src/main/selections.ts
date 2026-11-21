import { selectItems, walkItems } from '../core/items'
import { asSelect, asString, isRecord } from '../core/ipcArgs'
import type { Page, Project } from '../core/types'
import { variableContext } from '../core/variables'
import { handle } from './ipc'
import { readJson, userDataFile, writeJson } from './jsonStore'
import { callFunction } from './scriptCall'
import type { SessionOf } from './session'

// remember: true の select の値。案件フォルダ → (select の ID → 値)。
// ウィンドウの session はメモリだけで localStorage が残らないため、ファイルに置く（→ docs/archive/phase9-groups-select/PLAN.md）
type Store = Record<string, Record<string, string>>

const storeFile = (): string => userDataFile('selections.json')

const read = (): Store =>
  readJson(storeFile(), (raw) => (isRecord(raw) ? (raw as Store) : undefined), {})

/** 案件で記憶している select の値 */
export function readRemembered(launcherDir: string | undefined): Record<string, string> {
  const values = launcherDir ? read()[launcherDir] : undefined
  return typeof values === 'object' && values !== null ? values : {}
}

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

function remember(launcherDir: string, name: string, value: string): void {
  const store = read()
  store[launcherDir] = { ...store[launcherDir], [name]: value }
  try {
    writeJson(storeFile(), store)
  } catch {
    // 書けなくても、開いている間の選択は使える
  }
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
