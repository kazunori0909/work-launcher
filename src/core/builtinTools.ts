// Info ページの組み込みのツール（設定の tools に名前だけで書けるもの）。
// ツールを足すときは BUILTIN_TOOLS に1件足す。ヘルプの表もここから作る

import type { InfoTool } from './types'

/**
 * OS ごとのコマンド。文字列なら全 OS 共通。
 * 書き分けたときは書いた OS でだけ取れる（other は Windows・Mac 以外）
 */
type PerOs = string | { win?: string; mac?: string; other?: string }

export interface BuiltinTool {
  /** 設定の tools に書く名前 */
  name: string
  /** Info に出す名前（省略時は name） */
  label?: string
  /** ヘルプの表の「出すもの」 */
  help: string
  /** バージョンを出すコマンド。ランチャーのフォルダで動かす */
  command: PerOs
  /** 出力からバージョンを抜く正規表現（1つ目のグループ）。省略時は最初の空でない行 */
  pattern?: string
  /**
   * Mac で、本体が無いと導入を促すダイアログを出すスタブのことがあるもの。
   * command -v で path が見つかり、check が失敗したら、呼ばずに未インストールとする
   */
  macStub?: { path: string; check: [command: string, ...args: string[]] }
}

/** cmd.exe から動かす PowerShell。script には二重引用符を使わない */
const powershell = (script: string): string =>
  `powershell -NoProfile -NonInteractive -Command "${script}"`

// Windows はインストール先をレジストリから探す。64bit 用（Win64・win64）を先に見る
// Steam は「Steam について」に出るクライアントのバージョン（manifest の version）
const WIN_STEAM_SCRIPT =
  "Get-ChildItem (Join-Path (Get-ItemProperty 'HKCU:\\Software\\Valve\\Steam').SteamPath 'package\\steam_client_win*.manifest') | Sort-Object Name -Descending | Select-Object -First 1 | Get-Content -TotalCount 5"
// Epic はキー名が GUID なので、アンインストール情報を表示名で探し、ランチャー本体のバージョンを読む
const WIN_EPIC_SCRIPT =
  "$l = Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' | Where-Object { $_.DisplayName -eq 'Epic Games Launcher' } | Select-Object -First 1; if ($l) { Get-Item (Join-Path $l.InstallLocation 'Launcher\\Portal\\Binaries\\Win*\\EpicGamesLauncher.exe') | Sort-Object FullName -Descending | Select-Object -First 1 | ForEach-Object { $_.VersionInfo.ProductVersion } }"

// Mac の Steam は初回起動でクライアントを Application Support に入れる。manifest の形は Windows と同じ
const MAC_STEAM_MANIFEST =
  '"$HOME/Library/Application Support/Steam/Steam.AppBundle/Steam/Contents/MacOS/package/steam_client_osx.manifest"'
// Mac の Epic はアプリの Info.plist のバージョン（アプリ内の表示と同じ）
const MAC_EPIC_PLIST = '"/Applications/Epic Games Launcher.app/Contents/Info"'

/** git・python3 のスタブの本体はコマンドライン・デベロッパツール */
const XCODE_CHECK: [string, ...string[]] = ['xcode-select', '-p']

export const BUILTIN_TOOLS: BuiltinTool[] = [
  {
    name: 'git',
    help: 'Git',
    command: 'git --version',
    pattern: 'git version (\\S+)',
    macStub: { path: '/usr/bin/git', check: XCODE_CHECK }
  },
  { name: 'node', help: 'Node.js', command: 'node --version', pattern: 'v?(\\S+)' },
  { name: 'npm', help: 'npm', command: 'npm --version' },
  {
    name: 'python',
    help: 'Python（Windows は py、無ければ python。Mac は python3）',
    // Windows は実行と同じく py を先に試す（python.exe は Store へ案内するスタブのことがある）
    command: {
      win: 'py --version 2>nul || python --version',
      mac: 'python3 --version',
      other: 'python3 --version'
    },
    pattern: 'Python (\\S+)',
    macStub: { path: '/usr/bin/python3', check: XCODE_CHECK }
  },
  {
    name: 'java',
    help: 'Java',
    command: 'java -version',
    pattern: 'version "([^"]+)"',
    macStub: { path: '/usr/bin/java', check: ['/usr/libexec/java_home'] }
  },
  {
    name: 'docker',
    help: 'Docker',
    command: 'docker --version',
    pattern: 'Docker version ([^,\\s]+)'
  },
  { name: 'dotnet', help: '.NET SDK', command: 'dotnet --version' },
  {
    name: 'steam',
    label: 'Steam',
    help: 'Steam（「Steam について」に出るクライアントのバージョン）',
    command: { win: powershell(WIN_STEAM_SCRIPT), mac: `head -n 5 ${MAC_STEAM_MANIFEST}` },
    pattern: '"version"\\s+"(\\d+)"'
  },
  {
    name: 'epic',
    label: 'Epic Games Launcher',
    help: 'Epic Games Launcher',
    command: {
      win: powershell(WIN_EPIC_SCRIPT),
      mac: `defaults read ${MAC_EPIC_PLIST} CFBundleShortVersionString`
    }
  }
]

export function builtinTool(name: string): BuiltinTool | undefined {
  return BUILTIN_TOOLS.find((t) => t.name === name)
}

function commandFor(tool: BuiltinTool, platform: string): string | undefined {
  if (typeof tool.command === 'string') return tool.command
  const { win, mac, other } = tool.command
  return platform === 'win32' ? win : platform === 'darwin' ? mac : other
}

/** 組み込みのツールのうち、この OS では取れないもの */
export function isUnsupportedTool(name: string, platform: string): boolean {
  const tool = builtinTool(name)
  return !!tool && !commandFor(tool, platform)
}

export interface ToolCommand {
  command: string
  pattern?: string
}

/** 組み込みのツールのバージョンの取り方 */
export function builtinToolCommand(name: string, platform: string): ToolCommand | undefined {
  const tool = builtinTool(name)
  const command = tool && commandFor(tool, platform)
  return command ? { command, pattern: tool.pattern } : undefined
}

/**
 * 設定の tools の1件のバージョンの取り方。
 * command を書けば command と pattern をまとめて置き換え、pattern だけなら組み込みのコマンドの出力から抜き出す
 */
export function toolCommand(tool: InfoTool, platform: string): ToolCommand | undefined {
  if (tool.command) return { command: tool.command, pattern: tool.pattern }
  const builtin = builtinToolCommand(tool.name, platform)
  return builtin && { command: builtin.command, pattern: tool.pattern ?? builtin.pattern }
}

/** 表示名。組み込みの名前は、取り方を上書きしても製品名で出す */
export function toolDisplayName(tool: { name: string }): string {
  return builtinTool(tool.name)?.label || tool.name
}
