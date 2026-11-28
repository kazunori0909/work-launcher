import { describe, expect, it } from 'vitest'
import { isTheme, parseThemeStore, withTheme } from './theme'

describe('theme', () => {
  it('isTheme は3つの値だけを通す', () => {
    expect(['system', 'light', 'dark'].every(isTheme)).toBe(true)
    expect(isTheme('auto')).toBe(false)
    expect(isTheme(undefined)).toBe(false)
  })

  it('parseThemeStore はテーマでない値と system を捨てる', () => {
    expect(parseThemeStore({ a: 'dark', b: 'light', c: 'system', d: 'blue', e: 1 })).toEqual({
      a: 'dark',
      b: 'light'
    })
    expect(parseThemeStore([])).toBeUndefined()
    expect(parseThemeStore('dark')).toBeUndefined()
  })

  it('withTheme は案件ごとに書き、system なら消す', () => {
    const store = withTheme({ a: 'dark' }, 'b', 'light')
    expect(store).toEqual({ a: 'dark', b: 'light' })
    expect(withTheme(store, 'a', 'system')).toEqual({ b: 'light' })
    // 元の表は変えない
    expect(store).toEqual({ a: 'dark', b: 'light' })
  })
})
