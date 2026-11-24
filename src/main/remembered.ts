import { isRecord } from '../core/ipcArgs'
import { readJson, userDataFile, writeJson } from './jsonStore'

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

/** select の値を記憶する（remember: true のもの） */
export function remember(launcherDir: string, name: string, value: string): void {
  const store = read()
  store[launcherDir] = { ...store[launcherDir], [name]: value }
  try {
    writeJson(storeFile(), store)
  } catch {
    // 書けなくても、開いている間の選択は使える
  }
}
