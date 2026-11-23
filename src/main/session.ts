import type { BrowserWindow, UtilityProcess, WebContents } from 'electron'
import type { RunEvent } from '../core/ipc'
import type { RunHandle } from '../core/runner'
import { NO_DISABLED } from '../core/itemState'
import type { DisabledItems, ItemState, ProjectView } from '../core/types'
import { send } from './ipc'
import { FileWatcher } from './watch'

/**
 * 1つのウィンドウと、そこで開いている案件（未指定なら開始画面）。
 * そのウィンドウで動いているもの（exec のプロセス・function の子プロセス）もここで持つ
 */
export class WindowSession {
  launcherDir?: string
  view?: ProjectView
  readonly watcher: FileWatcher
  /** 実行中の exec（runId → 止め方） */
  readonly runs = new Map<number, RunHandle>()
  /** 実行中の function の子プロセス */
  readonly scripts = new Set<UtilityProcess>()
  /** いまの select の値（ID → 値）。画面で変えるたびに知らされる。イベントの ctx.select に渡す */
  select: Record<string, string> = {}
  /** 画面で押せない項目（JS の ctx.disable で変わる。案件を開き直したら戻す） */
  disabled: DisabledItems = NO_DISABLED
  /** beforeOpen を呼んだ案件。設定の読み直しで呼び直さないために見る */
  openedDir?: string
  /** イベントで JS の実行を聞いて、許可されなかった（開いている間は聞き直さない） */
  scriptsDeclined = false
  /** change の関数を順に呼ぶための、最後に積んだ呼び出し */
  changeQueue: Promise<unknown> = Promise.resolve()
  /** beforeClose を待ち終えた（このあとの close では待たない） */
  closeReady = false
  /** beforeClose を待っている間の Promise（2回目の close で呼び直さない） */
  closing?: Promise<void>

  constructor(
    readonly window: BrowserWindow,
    onFilesChanged: () => void
  ) {
    this.watcher = new FileWatcher(onFilesChanged)
  }

  get contents(): WebContents {
    return this.window.webContents
  }

  /** 実行の知らせを画面に送る */
  sendRun(event: RunEvent): void {
    send(this.contents, 'run:event', event)
  }

  get itemState(): ItemState {
    return { select: this.select, disabled: this.disabled }
  }

  /** 項目の状態が変わったことを画面に送る */
  sendState(): void {
    send(this.contents, 'project:state', this.itemState)
  }

  /** このウィンドウで動いているものをすべて止める */
  stopAll(): void {
    for (const run of this.runs.values()) run.stop()
    for (const child of this.scripts) child.kill()
  }

  /** ウィンドウを閉じたとき */
  close(): void {
    this.watcher.close()
    this.stopAll()
  }
}

/** IPC を送ってきたウィンドウのセッション */
export type SessionOf = (sender: WebContents) => WindowSession | undefined
