import { ipcMain } from 'electron'
import type { IpcMainInvokeEvent, WebContents } from 'electron'
import { INVOKE_CHANNELS } from '../core/ipc'
import type { EventPayloads, InvokeApi } from '../core/ipc'

type Result<K extends keyof InvokeApi> = Awaited<ReturnType<InvokeApi[K]>>

/**
 * 画面からの依頼を受ける。名前と戻り値は core/ipc.ts の約束で確かめる。
 * 引数は画面から来るため unknown で受け、core/ipcArgs.ts の関数で確かめてから使う
 */
export function handle<K extends keyof InvokeApi>(
  name: K,
  fn: (e: IpcMainInvokeEvent, ...args: unknown[]) => Result<K> | Promise<Result<K>>
): void {
  ipcMain.handle(INVOKE_CHANNELS[name], fn)
}

/** 画面に知らせる。閉じたウィンドウには送らない */
export function send<C extends keyof EventPayloads>(
  target: WebContents,
  channel: C,
  payload: EventPayloads[C]
): void {
  if (!target.isDestroyed()) target.send(channel, payload)
}
