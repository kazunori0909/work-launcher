import { describe, expect, it } from 'vitest'
import { checkExternalUrl, hrefAllowed, normalizeScheme } from './schemes'

describe('normalizeScheme', () => {
  it('小文字にし、末尾の : を落とす', () => {
    expect(normalizeScheme('HTTPS')).toBe('https')
    expect(normalizeScheme(' file: ')).toBe('file')
    expect(normalizeScheme('ms-excel')).toBe('ms-excel')
  })

  it('スキームとして書けないものは undefined', () => {
    expect(normalizeScheme('')).toBeUndefined()
    expect(normalizeScheme('1abc')).toBeUndefined()
    expect(normalizeScheme('http://')).toBeUndefined()
    expect(normalizeScheme('a b')).toBeUndefined()
  })
})

describe('checkExternalUrl', () => {
  it('既定では http・https・mailto だけを開く', () => {
    expect(checkExternalUrl('https://example.com/a?b=1')).toEqual({
      type: 'url',
      url: 'https://example.com/a?b=1'
    })
    expect(checkExternalUrl('mailto:a@example.com')).toMatchObject({ type: 'url' })
    expect(checkExternalUrl('file:///etc/passwd')).toMatchObject({ type: 'invalid' })
    expect(checkExternalUrl('javascript:alert(1)')).toMatchObject({ type: 'invalid' })
    expect(checkExternalUrl('ms-msdt:/id')).toMatchObject({ type: 'invalid' })
  })

  it('許可していないスキームは、openSchemes に触れた理由を返す', () => {
    const r = checkExternalUrl('file:///C:/tools/a.exe')
    expect(r).toMatchObject({ type: 'invalid' })
    expect(r.type === 'invalid' && r.reason).toContain('file: は開けません')
    expect(r.type === 'invalid' && r.reason).toContain('openSchemes')
  })

  it('並びを渡したら、それだけを開く', () => {
    expect(checkExternalUrl('http://example.com/', ['https'])).toMatchObject({ type: 'invalid' })
    expect(checkExternalUrl('HTTPS://example.com/', ['https'])).toMatchObject({ type: 'url' })
  })

  it('file: を許したら、パスに直す対象として返す', () => {
    const schemes = ['http', 'https', 'file']
    expect(checkExternalUrl('file:///C:/share/a.xlsx', schemes)).toEqual({
      type: 'file',
      url: 'file:///C:/share/a.xlsx'
    })
    expect(checkExternalUrl('file://server/share/doc.pdf', schemes)).toEqual({
      type: 'file',
      url: 'file://server/share/doc.pdf'
    })
  })

  it('URL として読めなければ invalid', () => {
    expect(checkExternalUrl('example.com')).toMatchObject({ type: 'invalid' })
    expect(checkExternalUrl('')).toMatchObject({ type: 'invalid' })
  })
})

describe('hrefAllowed', () => {
  it('スキームの無いリンク（相対・#）は残す', () => {
    expect(hrefAllowed('notes/a.md')).toBe(true)
    expect(hrefAllowed('#手順')).toBe(true)
    expect(hrefAllowed('C:\\share\\a.xlsx')).toBe(true)
  })

  it('openSchemes にあるスキームだけ残す', () => {
    expect(hrefAllowed('https://example.com')).toBe(true)
    expect(hrefAllowed('file:///C:/a.txt')).toBe(false)
    expect(hrefAllowed('file:///C:/a.txt', ['https', 'file'])).toBe(true)
  })

  it('javascript・vbscript・data は並べても残さない', () => {
    expect(hrefAllowed('javascript:alert(1)', ['javascript'])).toBe(false)
    expect(hrefAllowed(' JavaScript:alert(1)', ['javascript'])).toBe(false)
    expect(hrefAllowed('data:text/html,x', ['data'])).toBe(false)
  })
})

describe('checkExternalUrl の禁止スキーム', () => {
  it('並べても javascript は開かない', () => {
    expect(checkExternalUrl('javascript:alert(1)', ['javascript'])).toMatchObject({
      type: 'invalid'
    })
  })
})
