import { describe, expect, it } from 'vitest'
import { ctxCall } from './ctxCalls'

describe('ctxCall', () => {
  it('種類ごとに頼む内容を作る', () => {
    expect(ctxCall('open', 'logs')).toEqual({ action: 'open', path: 'logs' })
    expect(ctxCall('url', 'https://example.com', { params: { q: 'a', n: 1 } })).toEqual({
      action: 'url',
      url: 'https://example.com',
      params: { q: 'a', n: '1' }
    })
    expect(ctxCall('excel', 'a.xlsx')).toEqual({ action: 'excel', path: 'a.xlsx', readonly: false })
    expect(ctxCall('word', 'a.docx', { readonly: true })).toMatchObject({ readonly: true })
  })

  it('実行系は終わりを待つのが既定。wait: false で待たない', () => {
    expect(ctxCall('sh', 'echo a', { cwd: 'tools', env: { A: 'b' }, encoding: 'utf-8' })).toEqual({
      action: 'exec',
      kind: 'sh',
      script: 'echo a',
      cwd: 'tools',
      env: { A: 'b' },
      encoding: 'utf-8',
      wait: true,
      console: true
    })
    expect(ctxCall('bat', 'x', { wait: false, console: false })).toMatchObject({
      kind: 'bat',
      wait: false,
      console: false
    })
  })

  it('誤った引数は例外にする', () => {
    expect(() => ctxCall('open', 1)).toThrow('ctx.open: 1つ目の引数は文字列で書いてください')
    expect(() => ctxCall('url', 'https://example.com', { icon: 'search' })).toThrow(
      'ctx.url: 書けないキーです: icon（書けるのは params）'
    )
    expect(() => ctxCall('open', 'a', { readonly: true })).toThrow(
      'ctx.open: 書けないキーです: readonly'
    )
    expect(() => ctxCall('excel', 'a.xlsx', { readonly: 'yes' })).toThrow('true / false')
    expect(() => ctxCall('sh', 'x', { cwd: 1 })).toThrow('cwd は文字列')
    expect(() => ctxCall('sh', 'x', { env: [] })).toThrow('env は { 名前: 値 }')
    expect(() => ctxCall('sh', 'x', 'tools')).toThrow('2つ目の引数')
  })
})
