import { useMemo, useState } from 'react'
import { currentSelections, itemLabel } from '../../../core/items'
import type { ProjectView } from '../../../core/types'
import type { SelectContextValue } from '../components/selectContext'

/**
 * 案件の select の値。選んだ値（メインの値を含む）→ 記憶した値（remember: true のものだけ）→ 既定値 の順に使う。
 * 選んだ値は案件フォルダごとに持つ（別の案件に切り替えたら捨てる）。
 * 変えた値はメインに知らせる（記憶と change の関数はメインが受け持つ）。change の失敗は onError に渡す
 */
export function useSelections(
  view: ProjectView | undefined,
  onError: (text: string) => void
): SelectContextValue {
  /**
   * この画面で選んだ select の値（記憶の有無によらない）。dir は選んだときの案件フォルダ、
   * base はそのときのメインの値。メインの値が変わったら（読み直し・JS の ctx.set）メインの値を使う
   */
  const [chosenIn, setChosenIn] = useState<{
    dir?: string
    base?: Record<string, string>
    values: Record<string, string>
  }>({ values: {} })
  const launcherDir = view?.launcherDir
  const base = view?.state?.select
  const chosen = chosenIn.dir === launcherDir && chosenIn.base === base ? chosenIn.values : base
  const project = view?.project
  const remembered = view?.remembered
  const platform = view?.platform ?? ''

  return useMemo<SelectContextValue>(() => {
    if (!project) return { values: {}, onChange: () => {} }
    const values = currentSelections(project, remembered, chosen)
    return {
      values,
      onChange: async (item, value) => {
        setChosenIn({ dir: launcherDir, base, values: { ...chosen, [item.name]: value } })
        const select = { ...values, [item.name]: value }
        const result = await window.launcher.changeSelection(item.name, value, item.change, select)
        if (result.error) onError(`■ ${itemLabel(item, platform)}: ${result.error}`)
      }
    }
  }, [project, remembered, chosen, base, launcherDir, platform, onError])
}
