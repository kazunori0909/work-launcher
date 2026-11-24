import { describe, expect, it } from 'vitest'
import { ctxCall, dedent, stateCall } from './ctxCalls'

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

describe('stateCall', () => {
  it('set・enable・disable・reset の頼む内容を作る', () => {
    expect(stateCall('set', 'target', 'prod')).toEqual({
      action: 'set',
      id: 'target',
      value: 'prod'
    })
    expect(stateCall('set', 'dry', true)).toEqual({ action: 'set', id: 'dry', value: true })
    expect(stateCall('disable')).toEqual({ action: 'disable' })
    expect(stateCall('disable', 'a')).toEqual({ action: 'disable', ids: ['a'] })
    expect(stateCall('enable', ['a', 'b'])).toEqual({ action: 'enable', ids: ['a', 'b'] })
    expect(stateCall('reset')).toEqual({ action: 'reset' })
    expect(stateCall('reset', 'debug')).toEqual({ action: 'reset', ids: ['debug'] })
  })

  it('誤った引数は例外にする', () => {
    expect(() => stateCall('set', '', 'x')).toThrow('ctx.set: 1つ目の引数は文字列')
    expect(() => stateCall('set', 'a')).toThrow('ctx.set: 2つ目の引数は文字列か true / false')
    expect(() => stateCall('set', 'a', 1)).toThrow('2つ目の引数')
    expect(() => stateCall('disable', 1)).toThrow('ctx.disable: 引数は ID の文字列か、その配列')
    expect(() => stateCall('enable', ['a', 2])).toThrow('ctx.enable: 引数は ID')
  })
})

describe('dedent', () => {
  it('前後の空行と共通のインデントを取り除く', () => {
    expect(dedent('\n    if True:\n        print(1)\n\n    print(2)\n  ')).toBe(
      'if True:\n    print(1)\n\nprint(2)'
    )
    expect(dedent('\r\n  a\r\n  b\r\n')).toBe('a\nb')
    expect(dedent('echo a')).toBe('echo a')
  })

  it('実行系の本文にかける', () => {
    expect(ctxCall('python', '\n  print(1)\n')).toMatchObject({ script: 'print(1)' })
  })
})
