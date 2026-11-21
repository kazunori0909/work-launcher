import { afterEach, describe, expect, it } from 'vitest'
import { runEventEntries } from '../consoleEntries'
import { en } from './en'
import { ja } from './ja'
import { getLang, isLang, langFromLocale, setLang, t } from '.'

afterEach(() => setLang('ja'))

describe('langFromLocale', () => {
  it('日本語なら ja、それ以外は en', () => {
    expect(langFromLocale('ja')).toBe('ja')
    expect(langFromLocale('ja-JP')).toBe('ja')
    expect(langFromLocale('en-US')).toBe('en')
    expect(langFromLocale('zh-CN')).toBe('en')
    expect(langFromLocale('')).toBe('en')
  })
})

describe('setLang / t', () => {
  it('既定は ja で、切り替えると辞書が変わる', () => {
    expect(getLang()).toBe('ja')
    expect(t()).toBe(ja)
    setLang('en')
    expect(t()).toBe(en)
    expect(t().load.notString('label')).toBe('label must be a string')
  })

  it('isLang は対応している言語だけを通す', () => {
    expect(isLang('en')).toBe(true)
    expect(isLang('fr')).toBe(false)
    expect(isLang(undefined)).toBe(false)
  })

  it('括弧書きと並びは言語の書き方に合わせる', () => {
    expect(ja.paren('x')).toBe('（x）')
    expect(en.paren('x')).toBe(' (x)')
    expect(en.list(['a', 'b'])).toBe('a · b')
  })

  it('core の文言も切り替えた言語で作る', () => {
    setLang('en')
    const [entry] = runEventEntries(
      { type: 'exit', runId: 1, label: 'Build', code: 0, signal: null },
      []
    )
    expect(entry).toMatchObject({ text: '■ Build finished (code 0)' })
  })
})

describe('en の件数', () => {
  it('1 のときだけ単数にする', () => {
    expect(en.ui.diagnostics(0, 1)).toBe('Settings problems: 0 errors, 1 warning')
    expect(en.info.cores(1)).toBe('1 core')
    expect(en.info.cores('8')).toBe('8 cores')
  })
})
