import { describe, expect, it } from 'vitest'
import {
  BUILTIN_TOOLS,
  builtinTool,
  builtinToolCommand,
  isUnsupportedTool,
  toolCommand
} from './builtinTools'

describe('組み込みのツールの表', () => {
  it('名前は重ならない', () => {
    const names = BUILTIN_TOOLS.map((t) => t.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('steam・epic 以外は全 OS で取れる', () => {
    for (const { name } of BUILTIN_TOOLS) {
      for (const platform of ['win32', 'darwin', 'linux']) {
        const only = name === 'steam' || name === 'epic'
        expect(isUnsupportedTool(name, platform)).toBe(only && platform === 'linux')
        expect(!!builtinToolCommand(name, platform)).toBe(!(only && platform === 'linux'))
      }
    }
    expect(isUnsupportedTool('maven', 'linux')).toBe(false)
  })

  it('Mac のスタブ: git・python3 はデベロッパツール、java は java_home で本体を確かめる', () => {
    expect(builtinTool('git')?.macStub).toEqual({
      path: '/usr/bin/git',
      check: ['xcode-select', '-p']
    })
    expect(builtinTool('python')?.macStub?.path).toBe('/usr/bin/python3')
    expect(builtinTool('java')?.macStub?.check).toEqual(['/usr/libexec/java_home'])
    expect(BUILTIN_TOOLS.filter((t) => t.macStub).map((t) => t.name)).toEqual([
      'git',
      'python',
      'java'
    ])
  })
})

describe('設定での上書き（toolCommand）', () => {
  const steamWin = builtinToolCommand('steam', 'win32')!

  it('名前だけなら組み込みの取り方', () => {
    expect(toolCommand({ name: 'steam' }, 'win32')).toEqual(steamWin)
    expect(toolCommand({ name: 'maven' }, 'win32')).toBeUndefined()
  })

  it('pattern だけなら組み込みのコマンドの出力から、書いた pattern で抜き出す', () => {
    expect(toolCommand({ name: 'steam', pattern: 'v(\\d+)' }, 'win32')).toEqual({
      command: steamWin.command,
      pattern: 'v(\\d+)'
    })
  })

  it('command を書けば command と pattern をまとめて置き換える（組み込みの pattern は使わない）', () => {
    expect(toolCommand({ name: 'steam', command: 'type ver.txt' }, 'win32')).toEqual({
      command: 'type ver.txt',
      pattern: undefined
    })
    expect(toolCommand({ name: 'steam', command: 'cat v', pattern: '(\\d+)' }, 'linux')).toEqual({
      command: 'cat v',
      pattern: '(\\d+)'
    })
  })
})
