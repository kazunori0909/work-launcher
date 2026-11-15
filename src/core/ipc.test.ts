import { expect, it } from 'vitest'
import { EVENT_CHANNELS, INVOKE_CHANNELS } from './ipc'

it('IPC のチャンネル名は重ならない', () => {
  const all = [...Object.values(INVOKE_CHANNELS), ...Object.values(EVENT_CHANNELS)]
  expect(new Set(all).size).toBe(all.length)
})
