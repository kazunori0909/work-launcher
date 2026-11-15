import { contextBridge, ipcRenderer } from 'electron'
import type { IpcRendererEvent } from 'electron'
import { EVENT_CHANNELS, INVOKE_CHANNELS } from '../core/ipc'
import type { EventApi, EventPayloads, InvokeApi, LauncherApi } from '../core/ipc'

// 約束（チャンネル名と型）は core/ipc.ts。ここはそれを ipcRenderer につなぐだけ
const invoke = Object.fromEntries(
  Object.entries(INVOKE_CHANNELS).map(([name, channel]) => [
    name,
    (...args: unknown[]) => ipcRenderer.invoke(channel, ...args)
  ])
) as unknown as InvokeApi

function subscribe<C extends keyof EventPayloads>(channel: C) {
  return (listener: (payload: EventPayloads[C]) => void): (() => void) => {
    const handler = (_: IpcRendererEvent, payload: EventPayloads[C]): void => listener(payload)
    ipcRenderer.on(channel, handler)
    return () => ipcRenderer.removeListener(channel, handler)
  }
}

const events: EventApi = {
  onRunEvent: subscribe(EVENT_CHANNELS.onRunEvent),
  onProjectChanged: subscribe(EVENT_CHANNELS.onProjectChanged),
  onClosing: subscribe(EVENT_CHANNELS.onClosing)
}

const api: LauncherApi = { ...invoke, ...events }

contextBridge.exposeInMainWorld('launcher', api)
