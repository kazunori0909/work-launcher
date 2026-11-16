import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { Markdown } from './embed'

function render(text: string): string {
  return renderToStaticMarkup(createElement(Markdown, { text, baseDir: '' }))
}

describe('md のコードブロックの色付け', () => {
  it('言語を書いたブロックに色のクラスを付ける', () => {
    const html = render('```yaml\ntitle: 案件名 # コメント\n```')
    expect(html).toContain('<code class="language-yaml">')
    expect(html).toContain('<span class="hljs-attr">title:</span>')
    expect(html).toContain('<span class="hljs-comment"># コメント</span>')
  })

  it('別名でも色を付ける', () => {
    expect(render('```yml\na: 1\n```')).toContain('hljs-attr')
    expect(render('```bat\n@echo off\n```')).toContain('hljs-')
  })

  it('言語を書かないブロックと、登録していない言語は色を付けない', () => {
    expect(render('```\na: 1\n```')).not.toContain('hljs')
    expect(render('```python\nprint(1)\n```')).not.toContain('hljs-')
  })

  it('インラインコードには色を付けない', () => {
    expect(render('`a: 1`')).not.toContain('hljs')
  })

  it('コードの中の HTML はエスケープする', () => {
    const html = render('```html\n<img src=x onerror="alert(1)">\n```')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;')
  })

  // language-* のクラスは登録していなくても残るため、色の span が出ることで確かめる
  it.each([
    ['yaml', 'a: 1'],
    ['html', '<b>x</b>'],
    ['css', 'a { color: red }'],
    ['javascript', 'const a = 1'],
    ['typescript', 'let a: number'],
    ['json', '{"a": 1}'],
    ['bash', 'echo "a"'],
    ['shell', '$ echo a'],
    ['powershell', 'Write-Host "a"'],
    ['dos', 'echo off']
  ])('%s を登録している', (lang, code) => {
    expect(render('```' + lang + '\n' + code + '\n```')).toContain('<span class="hljs-')
  })
})
