import { describe, expect, it } from 'vitest'
import { dirOf, pathFromFileUrl, resolveAsset, resolveLink } from './markdown'

describe('resolveLink', () => {
  it('http・https・mailto は外部リンク', () => {
    expect(resolveLink('https://example.com/a?b=1', '')).toEqual({
      type: 'external',
      url: 'https://example.com/a?b=1'
    })
    expect(resolveLink('mailto:a@example.com', 'x')).toMatchObject({ type: 'external' })
  })

  it('それ以外のスキームは開かない', () => {
    expect(resolveLink('javascript:alert(1)', '')).toMatchObject({ type: 'invalid' })
    expect(resolveLink('file:///etc/passwd', '')).toMatchObject({ type: 'invalid' })
  })

  it('相対パスは baseDir 起点、/ 始まりは launcherDir 起点', () => {
    expect(resolveLink('setup.md', 'launcher/notes')).toEqual({
      type: 'file',
      path: 'launcher/notes/setup.md'
    })
    expect(resolveLink('../scripts/a.js', 'launcher/notes')).toEqual({
      type: 'file',
      path: 'launcher/scripts/a.js'
    })
    expect(resolveLink('/README.md', 'docs/deep')).toEqual({ type: 'file', path: 'README.md' })
  })

  it('# 以降は落とし、# だけならページ内リンク', () => {
    expect(resolveLink('b.md#手順', 'docs')).toEqual({ type: 'file', path: 'docs/b.md' })
    expect(resolveLink('#手順', 'docs')).toEqual({ type: 'anchor' })
  })

  it('案件フォルダより上には出ない', () => {
    expect(resolveLink('../../../etc/passwd', 'docs')).toEqual({
      type: 'file',
      path: 'etc/passwd'
    })
  })

  it('空白・日本語・バックスラッシュを含むパス', () => {
    expect(resolveLink('画像 1.png', 'docs')).toEqual({ type: 'file', path: 'docs/画像 1.png' })
    expect(resolveLink('a%20b.md', '')).toEqual({ type: 'file', path: 'a b.md' })
    expect(resolveLink('sub\\c.md', 'docs')).toEqual({ type: 'file', path: 'docs/sub/c.md' })
  })
})

describe('resolveAsset', () => {
  it('相対パスはプロトコルの URL にし、外部・data: はそのまま', () => {
    expect(resolveAsset('img/画像.png', 'docs')).toBe(
      'wl-file://project/docs/img/%E7%94%BB%E5%83%8F.png'
    )
    expect(resolveAsset('https://example.com/a.png', 'docs')).toBe('https://example.com/a.png')
    expect(resolveAsset('data:image/png;base64,AA', '')).toBe('data:image/png;base64,AA')
  })

  it('pathFromFileUrl で元に戻せる', () => {
    expect(pathFromFileUrl(resolveAsset('img/画像 1.png', 'docs'))).toBe('docs/img/画像 1.png')
    expect(pathFromFileUrl('https://example.com/a.png')).toBeUndefined()
  })
})

it('dirOf', () => {
  expect(dirOf('launcher/notes/a.md')).toBe('launcher/notes')
  expect(dirOf('a.md')).toBe('')
})
