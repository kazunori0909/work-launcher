import { describe, expect, it } from 'vitest'
import { highlight, highlightMd } from './highlight'
import type { CodeLang } from './highlight'

describe('highlight', () => {
  it('YAML のキーとコメントに色のクラスを付ける', () => {
    const html = highlight('title: 案件名 # コメント', 'yaml')
    expect(html).toContain('<span class="hljs-attr">title:</span>')
    expect(html).toContain('<span class="hljs-comment"># コメント</span>')
  })

  it('コードの中の HTML はエスケープする', () => {
    const html = highlight('- html: <b onclick="x()">注意</b>', 'yaml')
    expect(html).not.toContain('<b')
    expect(html).toContain('&lt;b')
  })

  it.each<CodeLang>(['yaml', 'html', 'css', 'javascript', 'typescript'])(
    '%s を登録している',
    (lang) => {
      expect(() => highlight('x', lang)).not.toThrow()
    }
  )
})

describe('highlightMd', () => {
  it('別名でも色付けする', () => {
    expect(highlightMd('a: 1', 'yml')).toContain('hljs-attr')
    expect(highlightMd('@echo off', 'bat')).toContain('hljs-')
  })

  it('登録していない言語は undefined', () => {
    expect(highlightMd('print(1)', 'python')).toBeUndefined()
  })
})
