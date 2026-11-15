import { samePath } from './recent'

/** 開いているウィンドウ（launcherDir が無ければ開始画面） */
export interface OpenWindow {
  id: number
  launcherDir?: string
}

export type OpenTarget =
  /** そのウィンドウを前に出すだけ */
  | { type: 'focus'; id: number }
  /** そのウィンドウ（開始画面）で案件を開き、前に出す */
  | { type: 'load'; id: number }
  | { type: 'create' }

/**
 * 案件をどのウィンドウで開くか。同じ案件のウィンドウがあれば前に出し、開始画面のウィンドウがあればそこで開く
 * （呼んだウィンドウが開始画面ならそれを先に使う）。どちらも無ければ新しいウィンドウ。
 * launcherDir が無ければ開始画面を開く（あれば前に出す）
 */
export function chooseOpenTarget(
  windows: OpenWindow[],
  launcherDir: string | undefined,
  callerId: number | undefined,
  platform: NodeJS.Platform
): OpenTarget {
  const start = (): OpenWindow | undefined => {
    const caller = windows.find((w) => w.id === callerId)
    return caller && !caller.launcherDir ? caller : windows.find((w) => !w.launcherDir)
  }
  if (!launcherDir) {
    const w = windows.find((w) => !w.launcherDir)
    return w ? { type: 'focus', id: w.id } : { type: 'create' }
  }
  const same = windows.find((w) => w.launcherDir && samePath(w.launcherDir, launcherDir, platform))
  if (same) return { type: 'focus', id: same.id }
  const w = start()
  return w ? { type: 'load', id: w.id } : { type: 'create' }
}
