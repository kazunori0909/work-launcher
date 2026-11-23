import { execSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  BUILTIN_TOOLS,
  builtinTool,
  builtinToolCommand,
  isUnsupportedTool,
  macAppVersion,
  toolCommand
} from './builtinTools'
import { extractVersion } from './info'

describe('組み込みのツールの表', () => {
  it('名前は重ならない', () => {
    const names = BUILTIN_TOOLS.map((t) => t.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it('アプリ（steam・epic と、エディタ・AI のアプリ）以外は全 OS で取れる', () => {
    const apps = ['steam', 'epic', 'vscode', 'claude', 'antigravity', 'antigravity-ide', 'cursor']
    for (const { name } of BUILTIN_TOOLS) {
      for (const platform of ['win32', 'darwin', 'linux']) {
        const only = apps.includes(name)
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

describe('エディタと AI のツール', () => {
  it('Mac はアプリの Info.plist、Windows はアンインストール情報の表示名で探す', () => {
    const cases = [
      ['vscode', 'Visual Studio Code', 'Microsoft Visual Studio Code'],
      ['claude', 'Claude', 'Claude'],
      ['antigravity', 'Antigravity', 'Antigravity'],
      ['antigravity-ide', 'Antigravity IDE', 'Antigravity IDE'],
      ['cursor', 'Cursor', 'Cursor']
    ]
    for (const [name, app, display] of cases) {
      const mac = builtinToolCommand(name, 'darwin')!.command
      expect(mac).toContain(`"/Applications/${app}.app"`)
      expect(mac).toContain(`"$HOME/Applications/${app}.app"`)
      expect(mac).toMatch(/kMDItemCFBundleIdentifier == '[\w.-]+'/)
      const win = builtinToolCommand(name, 'win32')!.command
      expect(win).toContain('DisplayVersion')
      expect(win).not.toMatch(/".*".*"/) // cmd.exe の二重引用符は外側の1組だけ
      const match = /-match '([^']+)'/.exec(win)![1]
      expect(new RegExp(match).test(display)).toBe(true)
    }
  })

  // 仮の HOME に仮のアプリを置き、Mac のコマンドを実際に動かす
  it.skipIf(process.platform !== 'darwin')('Mac は ~/Applications のアプリも見る', () => {
    const home = mkdtempSync(join(tmpdir(), 'wl-home-'))
    // 実在しないアプリ名とバンドル ID にして、開発者の Mac に入っているものを拾わない
    const cmd = macAppVersion('WorkLauncher Test App', 'invalid.worklauncher.test')
    const sh = (): string =>
      execSync(`${cmd}; echo "exit=$?"`, { env: { ...process.env, HOME: home }, encoding: 'utf8' })
    try {
      expect(sh().trim()).toMatch(/^exit=[1-9]/) // 無ければ失敗し、何も出さない
      const contents = join(home, 'Applications', 'WorkLauncher Test App.app', 'Contents')
      mkdirSync(contents, { recursive: true })
      writeFileSync(
        join(contents, 'Info.plist'),
        '<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><dict>' +
          '<key>CFBundleShortVersionString</key><string>9.8.7</string></dict></plist>'
      )
      expect(sh().trim()).toBe('9.8.7\nexit=0')
    } finally {
      rmSync(home, { recursive: true, force: true })
    }
  })

  it('表示名の正規表現は別の製品に当たらない', () => {
    const match = (name: string): RegExp =>
      new RegExp(/-match '([^']+)'/.exec(builtinToolCommand(name, 'win32')!.command)![1])
    expect(match('vscode').test('Microsoft Visual Studio Code (User)')).toBe(true)
    expect(match('vscode').test('Microsoft Visual Studio Code - Insiders')).toBe(false)
    expect(match('antigravity').test('Antigravity 2.34.0')).toBe(true)
    expect(match('antigravity').test('Antigravity IDE')).toBe(false)
    expect(match('antigravity').test('Antigravity IDE (User)')).toBe(false)
    expect(match('antigravity').test('Antigravity CLI')).toBe(false)
    expect(match('antigravity-ide').test('Antigravity IDE (User)')).toBe(true)
    expect(match('claude').test('Claude')).toBe(true)
    expect(match('claude').test('Claude Code')).toBe(false)
  })

  it('CLI は --version の出力からバージョンを抜き出す', () => {
    const cases = [
      ['claude-code', 'claude --version', '2.1.330 (Claude Code)\n', '2.1.330'],
      ['antigravity-cli', 'agy --version', '1.5.9\n', '1.5.9'],
      ['codex-cli', 'codex --version', 'codex-cli 0.169.0\n', '0.169.0'],
      ['gemini-cli', 'gemini --version', '0.68.0\n', '0.68.0'],
      [
        'copilot-cli',
        'copilot --version',
        "GitHub Copilot CLI 1.0.112.\nRun 'copilot update' to check for updates.\n",
        '1.0.112'
      ]
    ]
    for (const [name, command, output, version] of cases) {
      const cmd = builtinToolCommand(name, 'linux')!
      expect(cmd.command).toBe(command)
      expect(extractVersion(output, cmd.pattern)).toBe(version)
    }
  })
})
