import { useCallback, useEffect, useMemo, useState } from 'react'
import { compileRule } from '../../../core/console'
import type { ConsoleRule } from '../../../core/console'
import { opensConsole, runEventEntries, systemEntry } from '../../../core/consoleEntries'
import type { NewEntry } from '../../../core/consoleEntries'
import type { LineCounts } from '../../../core/consoleLog'
import type { RunningRun } from '../components/Console'
import { ConsoleLines } from '../lib/consoleLines'

/** コンソールに残す行の数。超えたら古い方から捨てる */
const MAX_LINES = 30_000

export interface Run extends RunningRun {
  /** 押した項目の場所。function から始めた実行には無い */
  pageId?: string
  path?: number[]
}

export interface ConsoleState {
  /** 行（DOM に直接足す） */
  lines: ConsoleLines
  /** 行の数と、エラー・警告の件数。行を足すたびに変わる */
  counts: LineCounts
  /** 実行中の exec */
  runs: Run[]
  open: boolean
  setOpen(open: boolean): void
  clear(): void
  /** アプリからのエラーを出す（コンソールを開く） */
  reportError(text: string): void
}

/** コンソールの行と実行中の一覧。実行の知らせを受けて行を足す */
export function useConsole(consoleRules: ConsoleRule[] | undefined): ConsoleState {
  const [lines] = useState(() => new ConsoleLines(MAX_LINES))
  const [counts, setCounts] = useState(lines.counts)
  const [runs, setRuns] = useState<Run[]>([])
  const [open, setOpen] = useState(false)
  const rules = useMemo(() => (consoleRules ?? []).map(compileRule), [consoleRules])

  useEffect(() => lines.subscribe(setCounts), [lines])

  // コンソールは実行の開始とエラーのときだけ開く
  const append = useCallback(
    (added: NewEntry[]) => {
      if (added.some(opensConsole)) setOpen(true)
      lines.append(added)
    },
    [lines]
  )

  useEffect(
    () =>
      window.launcher.onRunEvent((event) => {
        append(runEventEntries(event, rules))
        if (event.type === 'start') {
          const { runId, label, pageId, path } = event
          setRuns((prev) => [...prev, { runId, label, pageId, path }])
        } else if (event.type === 'exit') {
          setRuns((prev) => prev.filter((r) => r.runId !== event.runId))
        }
      }),
    [append, rules]
  )

  const reportError = useCallback(
    (text: string) => append([systemEntry('system', text, 'error')]),
    [append]
  )
  const clear = useCallback(() => lines.clear(), [lines])

  return { lines, counts, runs, open, setOpen, clear, reportError }
}
