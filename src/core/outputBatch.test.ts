import { describe, expect, it } from 'vitest'
import { batchOutput } from './outputBatch'
import type { Stream, Timer } from './outputBatch'

/** 手で進めるタイマー */
function manualTimer(): Timer & { fire(): void; pending: number } {
  let fn: (() => void) | undefined
  const t = {
    pending: 0,
    set(f: () => void) {
      fn = f
      t.pending++
      return t.pending
    },
    clear() {
      fn = undefined
    },
    fire() {
      const f = fn
      fn = undefined
      f?.()
    }
  }
  return t
}

const setup = (): {
  out: [Stream, string[]][]
  timer: ReturnType<typeof manualTimer>
  batch: ReturnType<typeof batchOutput>
} => {
  const out: [Stream, string[]][] = []
  const timer = manualTimer()
  const batch = batchOutput((s, l) => out.push([s, l]), 50, timer)
  return { out, timer, batch }
}

describe('batchOutput', () => {
  it('間隔が来るまで溜め、まとめて1回渡す', () => {
    const { out, timer, batch } = setup()
    batch.push('stdout', ['a'])
    batch.push('stdout', ['b'])
    expect(out).toEqual([])
    expect(timer.pending).toBe(1)
    timer.fire()
    expect(out).toEqual([['stdout', ['a', 'b']]])
  })

  it('stream が変わったら、それまでの分を先に渡して順番を保つ', () => {
    const { out, timer, batch } = setup()
    batch.push('stdout', ['a'])
    batch.push('stderr', ['e'])
    batch.push('stdout', ['b'])
    timer.fire()
    expect(out).toEqual([
      ['stdout', ['a']],
      ['stderr', ['e']],
      ['stdout', ['b']]
    ])
  })

  it('flush は溜めた分をすぐ渡し、タイマーを止める。空なら何も渡さない', () => {
    const { out, timer, batch } = setup()
    batch.flush()
    batch.push('stdout', ['a'])
    batch.flush()
    timer.fire()
    expect(out).toEqual([['stdout', ['a']]])
  })
})
