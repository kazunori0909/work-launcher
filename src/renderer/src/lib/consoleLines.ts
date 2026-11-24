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

/**
 * コンソールの行を、React を通さずに DOM に直接足す（足した行の分だけ DOM を触る）。
 * 要素はコンソールを閉じている間も持ち続け、開いたら Console がその場に付け直す
 */
export class ConsoleLines {
  private readonly log: ConsoleLog<HTMLElement>
  private el?: HTMLDivElement

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

  append(entries: NewEntry[]): void {
    const { added, removed } = this.log.append(entries)
    const frag = document.createDocumentFragment()
    // 1回に何万行も来ることがあるので、引数に広げずに1つずつ足す
    for (const node of added) frag.appendChild(node)
    this.root.append(frag)
    for (const node of removed) node.remove()
  }

  clear(): void {
    this.log.clear()
    this.root.replaceChildren()
  }

  setFilter(filter: ConsoleFilter): void {
    this.root.className = `console-lines filter-${filter}`
  }
}
