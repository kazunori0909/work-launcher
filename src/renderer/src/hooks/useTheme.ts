import { useEffect, useState } from 'react'
import type { Theme } from '../../../core/theme'
import type { ProjectView } from '../../../core/types'
import { applyTheme } from '../lib/theme'

/**
 * 案件のテーマ。メインが読んだ値（view.theme）から始め、選んだら画面に当ててメインに記憶させる。
 * 案件を開いていないとき view.theme は system（OS に従う）
 */
export function useTheme(view: ProjectView | undefined): [Theme, (theme: Theme) => void] {
  const dir = view?.launcherDir
  // 選んだ値は案件フォルダと組にする（別の案件を開いたら、メインが読んだその案件の値を使う）
  const [chosen, setChosen] = useState<{ dir: string; theme: Theme }>()
  const theme = dir && chosen?.dir === dir ? chosen.theme : (view?.theme ?? 'system')
  useEffect(() => applyTheme(theme), [theme])
  const choose = (next: Theme): void => {
    if (dir) setChosen({ dir, theme: next })
    void window.launcher.setTheme(next)
  }
  return [theme, choose]
}
