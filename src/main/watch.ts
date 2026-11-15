import { unwatchFile, watchFile } from 'node:fs'
import type { Stats } from 'node:fs'

/**
 * 決まったファイルの変更を見張る。保存時にファイルを置き換えるエディタでも取りこぼさないよう、
 * fs.watch ではなく更新日時を定期的に確かめる fs.watchFile を使う
 */
export class FileWatcher {
  private files = new Set<string>()
  private timer: NodeJS.Timeout | undefined

  constructor(private onChange: () => void) {}

  set(files: string[]): void {
    const next = new Set(files)
    for (const f of this.files) if (!next.has(f)) unwatchFile(f, this.listener)
    for (const f of next) if (!this.files.has(f)) watchFile(f, { interval: 500 }, this.listener)
    this.files = next
  }

  close(): void {
    this.set([])
    clearTimeout(this.timer)
  }

  // 続けて保存されたときにまとめて1回読み直す
  private listener = (cur: Stats, prev: Stats): void => {
    if (cur.mtimeMs === prev.mtimeMs && cur.size === prev.size) return
    clearTimeout(this.timer)
    this.timer = setTimeout(this.onChange, 200)
  }
}
