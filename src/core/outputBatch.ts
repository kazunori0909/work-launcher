// 画面へ送る出力をまとめる。画面とメインの両方から使えるよう、node: モジュールに依存させない

export type Stream = 'stdout' | 'stderr'

export interface OutputBatch {
  push(stream: Stream, lines: string[]): void
  /** 溜めている分をすぐ渡す（終了を知らせる前に呼ぶ） */
  flush(): void
}

export interface Timer {
  set(fn: () => void, ms: number): unknown
  clear(id: unknown): void
}

const defaultTimer: Timer = {
  set: (fn, ms) => setTimeout(fn, ms),
  clear: (id) => clearTimeout(id as ReturnType<typeof setTimeout>)
}

/**
 * 出力を溜め、最初の行から interval ミリ秒たったらまとめて emit に渡す。
 * stream が変わったら、それまでの分を先に渡す（stdout と stderr の順番を保つ）
 */
export function batchOutput(
  emit: (stream: Stream, lines: string[]) => void,
  interval: number,
  timer: Timer = defaultTimer
): OutputBatch {
  let stream: Stream = 'stdout'
  let pending: string[] = []
  let id: unknown

  const flush = (): void => {
    if (id !== undefined) timer.clear(id)
    id = undefined
    if (pending.length === 0) return
    const lines = pending
    pending = []
    emit(stream, lines)
  }

  return {
    push(next, lines) {
      if (lines.length === 0) return
      if (next !== stream) flush()
      stream = next
      for (const line of lines) pending.push(line)
      id ??= timer.set(flush, interval)
    },
    flush
  }
}
