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
  /** 新しい行に追従するか */
  const stick = useRef(true)
  /** スクロールバーをつかんでいる・文字を選んでいる */
  const dragging = useRef(false)

  // 行は React で描かず、持ち続けている要素をここに付ける
  useEffect(() => {
    const root = lines.root
    body.current?.append(root)
    return () => root.remove()
  }, [lines])

  useEffect(() => lines.setFilter(filter), [lines, filter])

  // 追従するときは、行が増えるたびに末尾へ動かす
  useEffect(() => {
    const el = body.current
    if (stick.current && el) el.scrollTop = el.scrollHeight
  }, [lines, counts, filter])

  useEffect(() => {
    const up = (): void => {
      dragging.current = false
    }
    window.addEventListener('pointerup', up)
    return () => window.removeEventListener('pointerup', up)
  }, [])

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
        tabIndex={0}
        // 追従をやめるのは、上へ戻す操作をしたときだけ。scroll の知らせだけでは、古い行を消して
        // 位置が変わったのか、使う人が動かしたのかを見分けられないため
        onWheel={(e) => {
          if (e.deltaY < 0) stick.current = false
        }}
        onKeyDown={(e) => {
          if (UP_KEYS.includes(e.key)) stick.current = false
        }}
        onPointerDown={() => {
          dragging.current = true
        }}
        onScroll={(e) => {
          const el = e.currentTarget
          const atEnd = el.scrollHeight - el.scrollTop - el.clientHeight < 8
          if (atEnd) stick.current = true
          else if (dragging.current) stick.current = false
        }}
      />
    </section>
  )
}

const UP_KEYS = ['ArrowUp', 'PageUp', 'Home']
