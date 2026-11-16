import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { compileRule } from '../../../core/console'
import type { ConsoleRule } from '../../../core/console'
import { opensConsole, runEventEntries, systemEntry } from '../../../core/consoleEntries'
import type { NewEntry } from '../../../core/consoleEntries'
import type { ConsoleEntry, RunningRun } from '../components/Console'

const MAX_ENTRIES = 5000

export interface Run extends RunningRun {
  /** 押した項目の場所。function から始めた実行には無い */
  pageId?: string
  path?: number[]
}

export interface ConsoleState {
  entries: ConsoleEntry[]
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
  const [entries, setEntries] = useState<ConsoleEntry[]>([])
  const [runs, setRuns] = useState<Run[]>([])
  const [open, setOpen] = useState(false)
  const nextKey = useRef(0)
  const rules = useMemo(() => (consoleRules ?? []).map(compileRule), [consoleRules])

  // コンソールは実行の開始とエラーのときだけ開く
  const append = useCallback((added: NewEntry[]) => {
    if (added.some(opensConsole)) setOpen(true)
    const keyed: ConsoleEntry[] = added.map((e) => ({ ...e, key: nextKey.current++ }))
    setEntries((prev) => [...prev, ...keyed].slice(-MAX_ENTRIES))
  }, [])

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
  const clear = useCallback(() => setEntries([]), [])

  return { entries, runs, open, setOpen, clear, reportError }
}
