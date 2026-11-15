import { describe, expect, it } from 'vitest'
import { asItemPath, asItemRef, asNumber, asSelect, asString } from './ipcArgs'

describe('IPC の引数', () => {
  it('型が違えば undefined', () => {
    expect(asString('a')).toBe('a')
    expect(asString(1)).toBeUndefined()
    expect(asNumber(3)).toBe(3)
    expect(asNumber(NaN)).toBeUndefined()
    expect(asNumber('3')).toBeUndefined()
  })

  it('位置の並びは 0 以上の整数だけ', () => {
    expect(asItemPath([2, 0])).toEqual([2, 0])
    expect(asItemPath([])).toEqual([])
    expect(asItemPath([1.5])).toBeUndefined()
    expect(asItemPath([-1])).toBeUndefined()
    expect(asItemPath(['0'])).toBeUndefined()
    expect(asItemPath('0')).toBeUndefined()
  })

  it('select の値は文字列だけ残す', () => {
    expect(asSelect({ a: 'x', b: 1, c: null })).toEqual({ a: 'x' })
    expect(asSelect(['x'])).toEqual({})
    expect(asSelect(undefined)).toEqual({})
  })

  it('項目を指す引数', () => {
    expect(asItemRef('top', [0], { env: 'prod' })).toEqual({
      pageId: 'top',
      path: [0],
      select: { env: 'prod' }
    })
    expect(asItemRef('top', [0], undefined)?.select).toEqual({})
    expect(asItemRef(1, [0], {})).toBeUndefined()
    expect(asItemRef('top', 'x', {})).toBeUndefined()
  })
})
