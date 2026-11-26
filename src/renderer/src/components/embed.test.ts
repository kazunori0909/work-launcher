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

describe('md のアラート', () => {
  it('[!NOTE] などで始まる引用をアラートにし、見出しを足す', () => {
    const html = render('> [!WARNING]\n> 消す前に **バックアップ** を取る')
    expect(html).toContain('<div class="wl-alert wl-alert-warning">')
    expect(html).toContain('警告</div>')
    expect(html).toContain('消す前に <strong>バックアップ</strong> を取る')
    expect(html).not.toContain('[!WARNING]')
    expect(html).not.toContain('<blockquote')
  })

  it('大文字・小文字は問わず、5種類を読む', () => {
    for (const [mark, label] of [
      ['note', 'メモ'],
      ['Tip', 'ヒント'],
      ['IMPORTANT', '重要'],
      ['caution', '注意']
    ]) {
      expect(render(`> [!${mark}]\n> 本文`)).toContain(`${label}</div>`)
    }
  })

  it('印の行のあとに空の行があっても、空の段落を残さない', () => {
    const html = render('> [!TIP]\n>\n> 本文')
    expect(html).not.toContain('<p></p>')
    expect(html).toContain('<p>本文</p>')
  })

  it('知らない種類・印が行の途中にあるものは、ふつうの引用のまま', () => {
    expect(render('> [!DANGER]\n> 本文')).toContain('<blockquote>')
    expect(render('> [!NOTE] 本文')).toContain('<blockquote>')
    expect(render('> 本文 [!NOTE]')).toContain('<blockquote>')
  })
})
