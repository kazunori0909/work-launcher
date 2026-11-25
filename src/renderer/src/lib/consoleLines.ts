import { ConsoleLog } from '../../../core/consoleLog'
import type { FilterMark, LineCounts, LineNodes } from '../../../core/consoleLog'
import type { ConsoleFilter, NewEntry } from '../../../core/consoleEntries'

function lineElement(entry: NewEntry, marks: FilterMark[]): HTMLDivElement {
  const el = document.createElement('div')
  if (entry.type === 'line') {
    el.className = `line ${entry.style.level}`
    if (entry.style.color) el.style.color = entry.style.color
    el.textContent = entry.text || ' '
  } else if (entry.type === 'prompt') {
    el.className = 'line prompt'
    const path = document.createElement('span')
    path.className = 'prompt-path'
    path.textContent = entry.text
    el.append(path, ` ${entry.command}`)
  } else {
    el.className = `line ${entry.type} ${entry.level}`
    el.textContent = entry.text
  }
  el.classList.add(...marks)
  return el
}

const domNodes: LineNodes<HTMLElement> = {
  create: lineElement,
  mark: (node, mark) => node.classList.add(mark)
}

/** 1フレームで行を足すのに使ってよい時間（ms）。残りは次のフレームに回す */
const FRAME_BUDGET = 8

/**
 * 行をこの数ずつブロック（div）にまとめる。コンテナの直下に何万もの要素を並べると、
 * 行を足すたびにブラウザが全部の位置を計算し直すため。古い行もブロックごと外せる
 */
const BLOCK_SIZE = 500

/**
 * コンソールの行を、React を通さずに DOM に直接足す（足した行の分だけ DOM を触る）。
 * 届いた行は溜めておき、フレームごとに決まった時間の分だけ足す（一気に届いても画面を止めない）。
 * 要素はコンソールを閉じている間も持ち続け、開いたら Console がその場に付け直す
 */
export class ConsoleLines {
  private readonly log: ConsoleLog<HTMLElement>
  private el?: HTMLDivElement
  /** 行のブロック（古い順） */
  private blocks: HTMLDivElement[] = []
  private frame?: number
  private listener?: (counts: LineCounts) => void

  constructor(max: number) {
    this.log = new ConsoleLog(domNodes, max)
  }

  /** 行を並べる要素。描く前（サーバーでの描画）に document を触らないよう、初めて使うときに作る */
  get root(): HTMLDivElement {
    if (!this.el) {
      this.el = document.createElement('div')
      this.el.className = 'console-lines'
    }
    return this.el
  }

  get counts(): LineCounts {
    return this.log.counts
  }

  /** 行を足したり消したりしたら知らせる（件数の表示と末尾への追従のため）。戻り値を呼ぶとやめる */
  subscribe(listener: (counts: LineCounts) => void): () => void {
    this.listener = listener
    return () => {
      if (this.listener === listener) this.listener = undefined
    }
  }

  append(entries: NewEntry[]): void {
    this.log.enqueue(entries)
    this.frame ??= requestAnimationFrame(() => this.drain())
  }

  clear(): void {
    if (this.frame !== undefined) cancelAnimationFrame(this.frame)
    this.frame = undefined
    this.log.clear()
    this.blocks = []
    this.root.replaceChildren()
    this.listener?.(this.log.counts)
  }

  setFilter(filter: ConsoleFilter): void {
    this.root.className = `console-lines filter-${filter}`
  }

  private drain(): void {
    this.frame = undefined
    const end = performance.now() + FRAME_BUDGET
    const { added, removed } = this.log.drain(() => performance.now() < end)
    for (const node of added) this.lastBlock().appendChild(node)
    this.removeOldest(removed.length)
    this.listener?.(this.log.counts)
    if (this.log.pendingCount > 0) this.frame = requestAnimationFrame(() => this.drain())
  }

  /** 行を足すブロック。いっぱいなら新しく作る */
  private lastBlock(): HTMLDivElement {
    const last = this.blocks.at(-1)
    if (last && last.childElementCount < BLOCK_SIZE) return last
    const block = document.createElement('div')
    block.className = 'console-block'
    this.root.appendChild(block)
    this.blocks.push(block)
    return block
  }

  /** 古い方から count 行を外す（ConsoleLog が捨てるのは、いつも古い方から続いた行） */
  private removeOldest(count: number): void {
    let rest = count
    while (rest > 0 && this.blocks.length > 0) {
      const block = this.blocks[0]
      const size = block.childElementCount
      if (size <= rest) {
        block.remove()
        this.blocks.shift()
        rest -= size
      } else {
        for (let i = 0; i < rest; i++) block.firstElementChild!.remove()
        rest = 0
      }
    }
  }
}
