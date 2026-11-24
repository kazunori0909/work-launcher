import { useEffect, useRef, useState } from 'react'
import type { ConsoleFilter } from '../../../core/consoleEntries'
import type { LineCounts } from '../../../core/consoleLog'
import { t } from '../../../core/i18n'
import type { ConsoleLines } from '../lib/consoleLines'

export interface RunningRun {
  runId: number
  label: string
}

interface Props {
  lines: ConsoleLines
  counts: LineCounts
  running: RunningRun[]
  onStop(runId: number): void
  onClear(): void
  onClose(): void
}

export function Console({
  lines,
  counts,
  running,
  onStop,
  onClear,
  onClose
}: Props): React.JSX.Element {
  const [filter, setFilter] = useState<ConsoleFilter>('all')
  const body = useRef<HTMLDivElement>(null)
  /** 最後に末尾へ動かしたときの位置。追従をやめたら Infinity */
  const autoTop = useRef(0)

  // 行は React で描かず、持ち続けている要素をここに付ける
  useEffect(() => {
    const root = lines.root
    body.current?.append(root)
    return () => root.remove()
  }, [lines])

  useEffect(() => lines.setFilter(filter), [lines, filter])

  // 末尾を見ているときだけ、新しい行に追従する
  useEffect(() => {
    const el = body.current
    if (!el) return
    if (!following(el, autoTop.current)) {
      autoTop.current = Infinity
      return
    }
    el.scrollTop = el.scrollHeight
    autoTop.current = el.scrollTop
  }, [lines, counts, filter])

  return (
    <section className="console">
      <div className="console-bar">
        <span className="console-title">{t().console.title}</span>
        <span className="count error">{t().console.errors(counts.error)}</span>
        <span className="count warn">{t().console.warnings(counts.warn)}</span>
        <select value={filter} onChange={(e) => setFilter(e.target.value as ConsoleFilter)}>
          <option value="all">{t().console.all}</option>
          <option value="warn">{t().console.warnUp}</option>
          <option value="error">{t().console.errorOnly}</option>
        </select>
        <button onClick={onClear}>{t().console.clear}</button>
        <span className="spacer" />
        {running.map((r) => (
          <button key={r.runId} className="stop" onClick={() => onStop(r.runId)}>
            {t().console.stop(r.label)}
          </button>
        ))}
        <button className="close" title={t().console.close} onClick={onClose}>
          ×
        </button>
      </div>
      <div
        className="console-body"
        ref={body}
        onScroll={(e) => {
          if (!following(e.currentTarget, autoTop.current)) autoTop.current = Infinity
        }}
      />
    </section>
  )
}

/**
 * 末尾を見ているか。scroll の知らせは遅れて届き、その間に行が増えていることがあるので、
 * 末尾にいなくても、最後に末尾へ動かした位置から上へ戻されていなければ見ているとみなす
 */
function following(el: HTMLElement, autoTop: number): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight < 8 || el.scrollTop >= autoTop - 1
}
