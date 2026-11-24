// コンソールの行の管理（件数・上限・絞り込みの印）。画面から使うため、node: モジュールに依存させない
import { levelOf } from './consoleEntries'
import type { NewEntry } from './consoleEntries'

/**
 * 絞り込みで出す行の印。「警告以上」では in-warn、「エラーのみ」では in-error の付いた行だけを出す
 * （隠すのは console.css）。実行の開始・終了の行には、その実行で当たる行が出た時点で印を足す
 */
export type FilterMark = 'in-warn' | 'in-error'

/** 行の表し方（画面では DOM の要素）。作るのと印を足すのだけを頼む */
export interface LineNodes<N> {
  create(entry: NewEntry, marks: FilterMark[]): N
  mark(node: N, mark: FilterMark): void
}

export interface LineCounts {
  /** いま持っている行の数 */
  size: number
  error: number
  warn: number
}

interface Row<N> {
  node: N
  /** 件数に入れたレベル */
  counted?: 'error' | 'warn'
  /** 実行の開始・終了の行なら、その実行 */
  markerOf?: number
}

interface RunMarks<N> {
  /** 開始・終了の行 */
  markers: N[]
  marks: Set<FilterMark>
}

/** 件数と絞り込みで、そのレベルの行として扱うか。プロンプトの行は数えない */
function countedLevel(entry: NewEntry): 'error' | 'warn' | undefined {
  if (entry.type === 'prompt') return undefined
  const level = levelOf(entry)
  return level === 'error' || level === 'warn' ? level : undefined
}

export function filterMarks(entry: NewEntry): FilterMark[] {
  const level = countedLevel(entry)
  if (level === 'error') return ['in-warn', 'in-error']
  return level === 'warn' ? ['in-warn'] : []
}

/**
 * コンソールの行を足していく。足すたびに全行を見直さず、足した行と捨てた行の分だけ数を変える。
 * 上限を超えたら、上限の1割をまとめて古い方から捨てる（捨てるたびに詰め直さないため）
 */
export class ConsoleLog<N> {
  private rows: Row<N>[] = []
  private runs = new Map<number, RunMarks<N>>()
  private _counts: LineCounts = { size: 0, error: 0, warn: 0 }

  constructor(
    private readonly nodes: LineNodes<N>,
    readonly max: number
  ) {}

  get counts(): LineCounts {
    return this._counts
  }

  /** 行を足す。作った要素と、上限を超えて捨てる要素を返す（捨てる方に、いま作ったものが入ることもある） */
  append(entries: NewEntry[]): { added: N[]; removed: N[] } {
    const counts = { ...this._counts }
    const added: N[] = []
    for (const entry of entries) {
      const marks = filterMarks(entry)
      const run = entry.runId === undefined ? undefined : this.runOf(entry.runId)
      const marker = run && (entry.type === 'start' || entry.type === 'end')
      const node = this.nodes.create(entry, marker ? [...new Set([...marks, ...run.marks])] : marks)
      if (marker) run.markers.push(node)
      if (run) {
        for (const m of marks) {
          if (run.marks.has(m)) continue
          run.marks.add(m)
          for (const n of run.markers) this.nodes.mark(n, m)
        }
      }
      const counted = countedLevel(entry)
      if (counted) counts[counted]++
      this.rows.push({ node, counted, markerOf: marker ? entry.runId : undefined })
      added.push(node)
    }
    const removed = this.trim(counts)
    counts.size = this.rows.length
    this._counts = counts
    return { added, removed }
  }

  clear(): void {
    this.rows = []
    this.runs.clear()
    this._counts = { size: 0, error: 0, warn: 0 }
  }

  private runOf(runId: number): RunMarks<N> {
    let run = this.runs.get(runId)
    if (!run) {
      run = { markers: [], marks: new Set() }
      this.runs.set(runId, run)
    }
    return run
  }

  private trim(counts: LineCounts): N[] {
    if (this.rows.length <= this.max) return []
    const drop = this.rows.length - this.max + Math.floor(this.max / 10)
    const gone = this.rows.splice(0, drop)
    for (const row of gone) {
      if (row.counted) counts[row.counted]--
      if (row.markerOf === undefined) continue
      const run = this.runs.get(row.markerOf)
      if (!run) continue
      run.markers = run.markers.filter((n) => n !== row.node)
      if (run.markers.length === 0) this.runs.delete(row.markerOf)
    }
    return gone.map((row) => row.node)
  }
}
