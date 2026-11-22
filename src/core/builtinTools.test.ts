import { describe, expect, it } from 'vitest'
import {
  BUILTIN_TOOLS,
  builtinTool,
  builtinToolCommand,
  isUnsupportedTool,
  toolCommand
} from './builtinTools'
import { extractVersion } from './info'

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
    expect(
      BUILTIN_TOOLS.filter((t) => t.macStub)
        .map((t) => t.name)
        .sort()
    ).toEqual(['git', 'java', 'python'])
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

describe('組み込みの pattern で実際の出力から抜き出す', () => {
  const version = (name: string, output: string): string | undefined =>
    extractVersion(output, builtinToolCommand(name, 'darwin')!.pattern)

  it.each([
    ['ruby', 'ruby 3.4.7 (2025-10-08 revision 7a5688e2a2) +PRISM [arm64-darwin25]\n', '3.4.7'],
    [
      'ruby',
      'ruby 2.6.10p210 (2022-04-12 revision 67958) [universal.arm64e-darwin25]\n',
      '2.6.10p210'
    ],
    ['go', 'go version go1.25.4 darwin/arm64\n', '1.25.4'],
    ['go', 'go version go1.26rc1 windows/amd64\r\n', '1.26rc1'],
    ['rust', 'rustc 1.91.1 (ed61e7d7e 2025-11-07)\n', '1.91.1'],
    [
      'php',
      'PHP 8.4.14 (cli) (built: Oct 21 2025 19:23:55) (NTS)\nCopyright (c) The PHP Group\n',
      '8.4.14'
    ]
  ])('%s: %j', (name, output, expected) => {
    expect(version(name, output)).toBe(expected)
  })
})
