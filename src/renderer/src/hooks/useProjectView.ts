import { useEffect, useState } from 'react'
import type { ProjectView } from '../../../core/types'

/** 開いている案件。設定ファイルが変わって読み直したら差し替わる。読み込み中は undefined */
export function useProjectView(): ProjectView | undefined {
  const [view, setView] = useState<ProjectView>()
  useEffect(() => {
    window.launcher.loadProject().then(setView)
    return window.launcher.onProjectChanged(setView)
  }, [])
  return view
}

/** 閉じる前の beforeClose を待っているか（しばらく終わらないときにメインが知らせる） */
export function useClosing(): boolean {
  const [closing, setClosing] = useState(false)
  useEffect(() => window.launcher.onClosing(() => setClosing(true)), [])
  return closing
}

/** ウィンドウタイトル（案件の title、無ければ案件フォルダの名前） */
export function useWindowTitle(view: ProjectView | undefined): string {
  const title = view?.project?.title ?? view?.launcherDir?.split(/[\\/]/).pop() ?? 'WorkLauncher'
  useEffect(() => {
    document.title = title
  }, [title])
  return title
}
