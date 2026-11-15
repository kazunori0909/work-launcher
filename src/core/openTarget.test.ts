import { describe, expect, it } from 'vitest'
import { chooseOpenTarget } from './openTarget'
import type { OpenWindow } from './openTarget'

const a: OpenWindow = { id: 1, launcherDir: '/p/a' }
const start1: OpenWindow = { id: 2 }
const start2: OpenWindow = { id: 3 }

describe('chooseOpenTarget', () => {
  it('同じ案件のウィンドウがあれば前に出す', () => {
    expect(chooseOpenTarget([start1, a], '/p/a', undefined, 'darwin')).toEqual({
      type: 'focus',
      id: 1
    })
  })

  it('Windows はパスの大文字小文字を区別しない', () => {
    const w = { id: 1, launcherDir: 'C:\\P\\A' }
    expect(chooseOpenTarget([w], 'c:\\p\\a', undefined, 'win32')).toEqual({ type: 'focus', id: 1 })
  })

  it('開始画面があればそこで開く。呼んだウィンドウが開始画面ならそれを使う', () => {
    expect(chooseOpenTarget([a, start1, start2], '/p/b', undefined, 'darwin')).toEqual({
      type: 'load',
      id: 2
    })
    expect(chooseOpenTarget([a, start1, start2], '/p/b', 3, 'darwin')).toEqual({
      type: 'load',
      id: 3
    })
    // 呼んだウィンドウが案件を開いていれば、ほかの開始画面を使う
    expect(chooseOpenTarget([a, start1], '/p/b', 1, 'darwin')).toEqual({ type: 'load', id: 2 })
  })

  it('どちらも無ければ新しいウィンドウ', () => {
    expect(chooseOpenTarget([a], '/p/b', undefined, 'darwin')).toEqual({ type: 'create' })
    expect(chooseOpenTarget([], '/p/b', undefined, 'darwin')).toEqual({ type: 'create' })
  })

  it('案件の指定が無ければ開始画面を前に出す。無ければ作る', () => {
    expect(chooseOpenTarget([a, start1], undefined, undefined, 'darwin')).toEqual({
      type: 'focus',
      id: 2
    })
    expect(chooseOpenTarget([a], undefined, undefined, 'darwin')).toEqual({ type: 'create' })
  })
})
