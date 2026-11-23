import { useEffect, useRef, useState } from 'react'
import { countLevel, filterEntries } from '../../../core/consoleEntries'
import type { ConsoleFilter, NewEntry } from '../../../core/consoleEntries'
import { t } from '../../../core/i18n'

export type ConsoleEntry = NewEntry & { key: number }

export interface RunningRun {
  runId: number
  label: string
}

interface Props {
  entries: ConsoleEntry[]
  running: RunningRun[]
  onStop(runId: number): void
  onClear(): void
  onClose(): void
}

export function Console({ entries, running, onStop, onClear, onClose }: Props): React.JSX.Element {
  const [filter, setFilter] = useState<ConsoleFilter>('all')
  const body = useRef<HTMLDivElement>(null)
  const stick = useRef(true)

  // 末尾を見ているときだけ、新しい行に追従する
  useEffect(() => {
    if (stick.current && body.current) body.current.scrollTop = body.current.scrollHeight
  }, [entries, filter])

  const shown = filterEntries(entries, filter)

  return (
    <section className="console">
      <div className="console-bar">
        <span className="console-title">{t().console.title}</span>
        <span className="count error">{t().console.errors(countLevel(entries, 'error'))}</span>
        <span className="count warn">{t().console.warnings(countLevel(entries, 'warn'))}</span>
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
          const el = e.currentTarget
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 8
        }}
      >
        {shown.map((e) =>
          e.type === 'line' ? (
            <div
              key={e.key}
              className={`line ${e.style.level}`}
              style={e.style.color ? { color: e.style.color } : undefined}
            >
              {e.text || ' '}
            </div>
          ) : e.type === 'prompt' ? (
            <div key={e.key} className="line prompt">
              <span className="prompt-path">{e.text}</span> {e.command}
            </div>
          ) : (
            <div key={e.key} className={`line ${e.type} ${e.level}`}>
              {e.text}
            </div>
          )
        )}
      </div>
    </section>
  )
}
