// utilityProcess で動かす。scripts に並べた JS を読み、指定の関数を ctx を渡して呼ぶ
import path from 'node:path'
// （仕組みは docs/phase2-minimal-app/PLAN.md「function（scripts.js）の動かし方」）

export interface CallRequest {
  /** 読み込む JS（絶対パス）。関数はこの中から名前で探す */
  files: string[]
  fn: string
  /** work.launcher があるフォルダ */
  launcherDir: string
  /** 作業フォルダ（このプロセスの cwd も同じ） */
  workDir: string
  /** select の値（ID → 値） */
  select: Record<string, string>
  /** イベントの関数なら true。関数が無ければ何もせず終える */
  optional?: boolean
  /** change で呼ぶとき、変えた項目 */
  changed?: SelectChange
}

export interface SelectChange {
  id: string
  value: string
  previous: string
}

export type HostMessage =
  | { type: 'log'; text: string }
  | { type: 'open'; path: string }
  | { type: 'openUrl'; url: string; params?: Record<string, string> }
  | { type: 'done' }
  | { type: 'error'; message: string }

const post = (message: HostMessage): void => process.parentPort.postMessage(message)

process.parentPort.once('message', async (e) => {
  const { files, fn, launcherDir, workDir, select, optional, changed } = e.data as CallRequest
  try {
    const found = files.flatMap((file) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(file)
      const target = mod?.[fn] ?? mod?.default?.[fn]
      return typeof target === 'function' ? [{ file, target }] : []
    })
    const names = (list: string[]): string => list.map((f) => path.basename(f)).join(', ')
    if (found.length === 0 && optional) return post({ type: 'done' })
    if (found.length === 0) throw new Error(`関数 ${fn} がありません（${names(files)}）`)
    if (found.length > 1) {
      throw new Error(`関数 ${fn} が複数のファイルにあります（${names(found.map((f) => f.file))}）`)
    }
    await found[0].target({
      launcherDir,
      workDir,
      env: process.env,
      select,
      ...(changed ? { changed } : {}),
      log: (text: unknown) => post({ type: 'log', text: String(text) }),
      open: (path: string) => post({ type: 'open', path }),
      openUrl: (url: string, params?: Record<string, string>) =>
        post({ type: 'openUrl', url, params })
    })
    post({ type: 'done' })
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : String(err) })
  }
})
