import type { SystemInfo } from '../../../src/core/info'
import { t } from '../../../src/core/i18n'
import type { Lang } from '../../../src/core/i18n'
import type { ConsoleRule } from '../../../src/core/console'
import type { Item } from '../../../src/core/types'
import pkg from '../../../package.json'

// 体験ページ（/try/）で描くボタンと、Info に出す仮の値。
// 押したときの説明は TryLauncher.tsx で、ボタンの種類から作る

/** 体験ページのボタン。yaml はその項目の書き方（押したときに自分の吹き出しで見せる） */
export interface DemoItem {
  item: Item
  yaml?: string
  /** グループの中のボタン（押したボタンの書き方と出力を、ボタンごとに持つ） */
  children?: DemoItem[]
  /** 実行系のボタンを押したときに、コンソールに出る（ことにする）行 */
  output?(platform: string): string[]
  /** 実行系の終了コード（省略時は 0） */
  exitCode?: number
  /** 説明の吹き出しに足す一文（その項目だけの見どころ） */
  note?: string
  /** 出力を1行ずつ流す間（ミリ秒）。長い処理だけ実際に近い間にする */
  lineDelay?: number
}

/** サンプル案件の console.yaml と同じ色分け（体験ページのコンソールの例に使う） */
export const DEMO_CONSOLE_RULES: ConsoleRule[] = [
  { pattern: '\\b(error|failed)\\b', flags: 'i', level: 'error' },
  { pattern: '^WARN', level: 'warn' },
  { pattern: '\\bdone\\b', level: 'success' }
]

const BREAK: DemoItem = { item: { kind: 'break' }, yaml: '- break' }

/** 設定の変数（${workDir}）を展開して渡す sh */
function listDocs(label: string, files: string[]): DemoItem {
  return {
    item: { kind: 'exec', scripts: { sh: 'ls "${workDir}/docs"' }, label, icon: 'list' },
    yaml: `- sh: ls "\${workDir}/docs"\n  label: ${label}\n  icon: list`,
    output: () => files
  }
}

/** サンプル案件の「長い処理（停止の確認用）」。1秒ごとに数を出す。確認（confirm）を出してから実行する */
function longRun(label: string, confirm: string): DemoItem {
  return {
    item: {
      kind: 'exec',
      scripts: { sh: 'for i in $(seq 1 30); do echo "$i"; sleep 1; done\necho done\n' },
      label,
      icon: 'hourglass',
      confirm
    },
    yaml: [
      '- sh: |',
      '    for i in $(seq 1 30); do echo "$i"; sleep 1; done',
      '    echo done',
      `  label: ${label}`,
      '  icon: hourglass',
      `  confirm: ${confirm}`
    ].join('\n'),
    output: () => [...Array.from({ length: 30 }, (_, i) => String(i + 1)), 'done'],
    lineDelay: 1000
  }
}

/** サンプル案件の「失敗する」（体験ページでは sh だけ。Windows でも Git Bash で動く） */
function failing(label: string, warn: string, error: string): DemoItem {
  return {
    item: {
      kind: 'exec',
      scripts: { sh: `echo "${warn}"\necho "${error}"\nexit 1\n` },
      label,
      icon: 'circle-x'
    },
    yaml: [
      '- sh: |',
      `    echo "${warn}"`,
      `    echo "${error}"`,
      '    exit 1',
      `  label: ${label}`,
      '  icon: circle-x'
    ].join('\n'),
    output: () => [warn, error],
    exitCode: 1
  }
}

const indent = (text: string, n: number): string =>
  text
    .split('\n')
    .map((l) => ' '.repeat(n) + l)
    .join('\n')

/** 枠で囲むグループ。書き方は中のボタンの書き方から作る */
function group(title: string, icon: string, children: DemoItem[]): DemoItem {
  return {
    item: { kind: 'group', title, icon, items: children.map((c) => c.item) },
    yaml: [
      `- group: ${title}`,
      `  icon: ${icon}`,
      '  items:',
      ...children.map((c) => indent(c.yaml ?? '', 4))
    ].join('\n'),
    children
  }
}

/**
 * サンプル案件の「資料」グループと同じ形（examples/sample/launcher/pages/sample-page.yaml）。
 * ファイル名のボタン（読み取り専用）の横に、編集モードで開くアイコンだけのボタンを添える
 */
function docsGroup(
  title: string,
  files: { kind: 'excel' | 'word'; path: string }[],
  tooltip: string
): DemoItem {
  const pairs = files.map((f): DemoItem[] => [
    {
      item: { kind: f.kind, path: f.path, readonly: true },
      yaml: `- ${f.kind}: ${f.path}\n  readonly: true`
    },
    {
      item: {
        kind: f.kind,
        path: f.path,
        readonly: false,
        label: '',
        icon: 'pencil-line',
        tooltip
      },
      yaml: `- ${f.kind}: ${f.path}\n  label: ''\n  icon: pencil-line\n  tooltip: ${tooltip}`
    }
  ])
  return {
    item: {
      kind: 'group',
      title,
      icon: 'folder',
      items: pairs.map((pair) => ({ kind: 'buttons', items: pair.map((p) => p.item) }))
    },
    yaml: [
      `- group: ${title}`,
      '  icon: folder',
      '  items:',
      ...pairs.map(
        (pair) => `    - buttons:\n${pair.map((p) => indent(p.yaml ?? '', 8)).join('\n')}`
      )
    ].join('\n'),
    children: pairs.flat()
  }
}

/** 出力の例に入れる日時（押したときの時刻） */
const now = (): string => {
  const d = new Date()
  const two = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}/${two(d.getMonth() + 1)}/${two(d.getDate())} ${two(d.getHours())}:${two(d.getMinutes())}:${two(d.getSeconds())}`
}
const PWSH_OS: Record<string, string> = {
  win32: 'Microsoft Windows NT 10.0.26100.0',
  darwin: 'Unix 24.1.0'
}
const PYTHON: Record<string, { version: string; os: string }> = {
  win32: { version: '3.12.7', os: 'Windows 11' },
  darwin: { version: '3.13.0', os: 'Darwin 24.1.0' }
}

/** URL・フォルダ・ファイルを開くボタン（見出しを付けずに1行に並べる） */
/** Redmine の新規チケットの URL（例の場所）。issue[…] に書いた値が起票画面に入る */
const REDMINE_NEW = 'https://redmine.example.com/projects/my-project/issues/new'

interface Ticket {
  label: string
  subject: string
  /** 本文のテンプレート（複数行） */
  description: string
  note: string
}

/** チケット起票。件名と本文のテンプレートを params で渡す */
function ticket(t: Ticket): DemoItem {
  return {
    item: {
      kind: 'url',
      url: REDMINE_NEW,
      params: {
        'issue[tracker_id]': '1',
        'issue[subject]': t.subject,
        'issue[description]': t.description
      },
      label: t.label,
      icon: 'ticket'
    },
    yaml: [
      `- url: ${REDMINE_NEW}`,
      '  params:',
      '    issue[tracker_id]: 1',
      `    issue[subject]: ${t.subject}`,
      '    issue[description]: |',
      indent(t.description.trimEnd(), 6),
      `  label: ${t.label}`,
      '  icon: ticket'
    ].join('\n'),
    note: t.note
  }
}

function openItems(m: { search: string; query: string; docs: string; ticket: Ticket }): DemoItem[] {
  return [
    {
      item: {
        kind: 'url',
        url: 'https://www.google.com/search',
        params: { q: m.query },
        label: m.search,
        icon: 'search'
      },
      yaml: `- url: https://www.google.com/search\n  params:\n    q: ${m.query}\n  label: ${m.search}\n  icon: search`
    },
    ticket(m.ticket),
    {
      item: { kind: 'open', path: 'docs', label: m.docs, icon: 'folder-open' },
      yaml: `- open: docs\n  label: ${m.docs}\n  icon: folder-open`
    },
    {
      item: { kind: 'open', path: 'README.md', icon: 'file-text' },
      yaml: '- open: README.md\n  icon: file-text'
    }
  ]
}

const ja: DemoItem[] = [
  ...openItems({
    search: '使い方を検索',
    query: 'WorkLauncher 使い方',
    docs: '資料フォルダ',
    ticket: {
      label: 'チケット起票',
      subject: '【不具合】',
      description: '## 現象\n\n## 再現手順\n1. \n\n## 期待する動き\n',
      note: '件名と本文のテンプレートを入れた状態で、Redmine の起票画面が開きます。複数行の本文も | でそのまま書けます（改行もエンコードします）。'
    }
  }),
  { item: { kind: 'break' } },
  docsGroup(
    '資料',
    [
      { kind: 'excel', path: 'docs/サンプル 仕様書.xlsx' },
      { kind: 'word', path: 'docs/サンプル 手順書.docx' }
    ],
    '編集モードで開く'
  ),
  // サンプル案件の「コマンド」グループの1行目（種類ごとに1つ）
  group('コマンド', 'terminal', [
    {
      item: {
        kind: 'exec',
        scripts: { bat: '@echo off\necho こんにちは、bat です（%DATE% %TIME%）\n' },
        label: 'bat',
        tooltip: 'Windows だけで動く'
      },
      yaml: `- bat: |
    @echo off
    echo こんにちは、bat です（%DATE% %TIME%）
  label: bat
  tooltip: Windows だけで動く`,
      output: () => [`こんにちは、bat です（${now()}.00）`]
    },
    {
      item: {
        kind: 'exec',
        scripts: { sh: `echo "こんにちは、sh です（$(date '+%Y/%m/%d %H:%M:%S')）"` },
        label: 'sh',
        tooltip: 'Windows では Git Bash で動く'
      },
      yaml: `- sh: echo "こんにちは、sh です（$(date '+%Y/%m/%d %H:%M:%S')）"
  label: sh
  tooltip: Windows では Git Bash で動く`,
      output: () => [`こんにちは、sh です（${now()}）`]
    },
    {
      item: {
        kind: 'exec',
        scripts: {
          powershell:
            'Write-Output "こんにちは、PowerShell $($PSVersionTable.PSVersion) です"\nWrite-Output "OS: $([System.Environment]::OSVersion.VersionString)"\nWrite-Output "日時: $(Get-Date -Format \'yyyy/MM/dd HH:mm:ss\')"\n'
        },
        label: 'PowerShell',
        tooltip: 'Mac では pwsh（PowerShell 7）が要る'
      },
      yaml: `- powershell: |
    Write-Output "こんにちは、PowerShell $($PSVersionTable.PSVersion) です"
    Write-Output "OS: $([System.Environment]::OSVersion.VersionString)"
    Write-Output "日時: $(Get-Date -Format 'yyyy/MM/dd HH:mm:ss')"
  label: PowerShell
  tooltip: Mac では pwsh（PowerShell 7）が要る`,
      output: (p) => ['こんにちは、PowerShell 7.4.6 です', `OS: ${PWSH_OS[p]}`, `日時: ${now()}`]
    },
    {
      item: {
        kind: 'exec',
        scripts: {
          python:
            'import datetime, platform\nprint(f"こんにちは、Python {platform.python_version()} です")\nprint(f"OS: {platform.system()} {platform.release()}")\nprint(f"日時: {datetime.datetime.now():%Y/%m/%d %H:%M:%S}")\n'
        },
        label: 'Python'
      },
      yaml: `- python: |
    import datetime, platform
    print(f"こんにちは、Python {platform.python_version()} です")
    print(f"OS: {platform.system()} {platform.release()}")
    print(f"日時: {datetime.datetime.now():%Y/%m/%d %H:%M:%S}")
  label: Python`,
      output: (p) => [
        `こんにちは、Python ${PYTHON[p].version} です`,
        `OS: ${PYTHON[p].os}`,
        `日時: ${now()}`
      ]
    },
    BREAK,
    listDocs('資料の一覧', ['サンプル 仕様書.xlsx', 'サンプル 手順書.docx', 'サンプル 説明.pptx']),
    failing('失敗する', 'WARN: これは警告', 'ERROR: これは失敗'),
    longRun('長い処理', '30 秒かかります。実行しますか？')
  ])
]

const en: DemoItem[] = [
  ...openItems({
    search: 'Search how-tos',
    query: 'WorkLauncher how to',
    docs: 'Docs folder',
    ticket: {
      label: 'New ticket',
      subject: '(Bug)',
      description: '## What happens\n\n## Steps to reproduce\n1. \n\n## Expected\n',
      note: 'Opens the Redmine new-issue form with the subject and body template filled in. You can write a multi-line body with | as is (line breaks are encoded too).'
    }
  }),
  { item: { kind: 'break' } },
  docsGroup(
    'Documents',
    [
      { kind: 'excel', path: 'docs/Sample spec.xlsx' },
      { kind: 'word', path: 'docs/Sample procedure.docx' }
    ],
    'Open for editing'
  ),
  group('Commands', 'terminal', [
    {
      item: {
        kind: 'exec',
        scripts: { bat: '@echo off\necho Hello from bat (%DATE% %TIME%)\n' },
        label: 'bat',
        tooltip: 'Windows only'
      },
      yaml: `- bat: |
    @echo off
    echo Hello from bat (%DATE% %TIME%)
  label: bat
  tooltip: Windows only`,
      output: () => [`Hello from bat (${now()}.00)`]
    },
    {
      item: {
        kind: 'exec',
        scripts: { sh: `echo "Hello from sh ($(date '+%Y/%m/%d %H:%M:%S'))"` },
        label: 'sh',
        tooltip: 'Runs with Git Bash on Windows'
      },
      yaml: `- sh: echo "Hello from sh ($(date '+%Y/%m/%d %H:%M:%S'))"
  label: sh
  tooltip: Runs with Git Bash on Windows`,
      output: () => [`Hello from sh (${now()})`]
    },
    {
      item: {
        kind: 'exec',
        scripts: {
          powershell:
            'Write-Output "Hello from PowerShell $($PSVersionTable.PSVersion)"\nWrite-Output "OS: $([System.Environment]::OSVersion.VersionString)"\nWrite-Output "Time: $(Get-Date -Format \'yyyy/MM/dd HH:mm:ss\')"\n'
        },
        label: 'PowerShell',
        tooltip: 'Needs pwsh (PowerShell 7) on Mac'
      },
      yaml: `- powershell: |
    Write-Output "Hello from PowerShell $($PSVersionTable.PSVersion)"
    Write-Output "OS: $([System.Environment]::OSVersion.VersionString)"
    Write-Output "Time: $(Get-Date -Format 'yyyy/MM/dd HH:mm:ss')"
  label: PowerShell
  tooltip: Needs pwsh (PowerShell 7) on Mac`,
      output: (p) => ['Hello from PowerShell 7.4.6', `OS: ${PWSH_OS[p]}`, `Time: ${now()}`]
    },
    {
      item: {
        kind: 'exec',
        scripts: {
          python:
            'import datetime, platform\nprint(f"Hello from Python {platform.python_version()}")\nprint(f"OS: {platform.system()} {platform.release()}")\nprint(f"Time: {datetime.datetime.now():%Y/%m/%d %H:%M:%S}")\n'
        },
        label: 'Python'
      },
      yaml: `- python: |
    import datetime, platform
    print(f"Hello from Python {platform.python_version()}")
    print(f"OS: {platform.system()} {platform.release()}")
    print(f"Time: {datetime.datetime.now():%Y/%m/%d %H:%M:%S}")
  label: Python`,
      output: (p) => [
        `Hello from Python ${PYTHON[p].version}`,
        `OS: ${PYTHON[p].os}`,
        `Time: ${now()}`
      ]
    },
    BREAK,
    listDocs('List docs', ['Sample procedure.docx', 'Sample slides.pptx', 'Sample spec.xlsx']),
    failing('Fail', 'WARN: this is a warning', 'ERROR: this failed'),
    longRun('Long task', 'This takes 30 seconds. Run it?')
  ])
]

export const DEMO_ITEMS: Record<Lang, DemoItem[]> = { ja, en }

/** 押したときに説明で見せる作業フォルダ（仮の場所） */
export const DEMO_WORK_DIR: Record<string, string> = {
  win32: 'C:\\work\\my-project',
  darwin: '~/work/my-project'
}

const GB = 1024 ** 3
const electron = pkg.devDependencies.electron.replace(/^\D+/, '')
const app = { version: pkg.version, electron }

/** Info に出す仮の値（OS ごと） */
export function demoInfo(platform: string): SystemInfo {
  if (platform === 'win32') {
    return {
      os: { name: 'Windows 11 Pro', version: '24H2', build: '26100.2314', arch: 'x64' },
      language: {
        display: ['ja-JP'],
        region: 'ja-JP',
        systemLocale: { name: 'ja-JP', codePage: 932 }
      },
      computerName: 'DEMO-PC',
      userName: 'you',
      cpu: { model: 'Intel(R) Core(TM) i7-12700', cores: 20 },
      memory: {
        totalBytes: 31.8 * GB,
        usedBytes: 14.2 * GB,
        modules: { sizes: [16 * GB, 16 * GB], type: 'DDR4', speedMHz: 3200, slots: 4 }
      },
      gpus: [{ model: 'NVIDIA GeForce RTX 3060', driver: '32.0.15.6094', vendorDriver: '560.94' }],
      drives: [
        {
          name: 'C:',
          mountPoint: 'C:\\',
          network: false,
          totalBytes: 953 * GB,
          freeBytes: 412 * GB
        },
        {
          name: 'D:',
          mountPoint: 'D:\\',
          network: false,
          totalBytes: 1863 * GB,
          freeBytes: 1290 * GB
        },
        {
          name: 'Z:',
          mountPoint: 'Z:\\',
          network: true,
          totalBytes: 3726 * GB,
          freeBytes: 980 * GB
        }
      ],
      addresses: [{ name: 'Ethernet', address: '192.168.0.10' }],
      env: [
        {
          name: 'PATH',
          value:
            'C:\\Windows\\system32;C:\\Windows;C:\\Program Files\\Git\\cmd;C:\\Program Files\\nodejs\\'
        },
        { name: 'JAVA_HOME', value: 'C:\\Program Files\\Java\\jdk-21' }
      ],
      registry: [
        {
          name: 'LongPathsEnabled',
          path: 'HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\FileSystem\\LongPathsEnabled',
          value: '1'
        },
        {
          name: 'Windows Ver.',
          path: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\DisplayVersion',
          value: '24H2'
        }
      ],
      tools: [
        { name: 'git', version: '2.47.1' },
        { name: 'node', version: '22.11.0' },
        { name: 'python', version: '3.12.7' },
        { name: 'java', version: '21.0.5' },
        { name: 'go' }
      ],
      app,
      problems: []
    }
  }
  return {
    os: { name: 'macOS', version: '15.1', build: '24B83', arch: 'arm64' },
    language: { display: ['ja-JP', 'en-US'], region: 'ja_JP' },
    computerName: 'demo-mac',
    userName: 'you',
    cpu: { model: 'Apple M3', cores: 8 },
    memory: { totalBytes: 16 * GB, usedBytes: 9.4 * GB },
    gpus: [{ model: 'Apple M3', cores: '10', metal: 'Metal 3' }],
    drives: [
      // アプリと同じく、/ には OS のボリューム名ではなく「起動ディスク」と付ける
      {
        name: t().info.bootDisk,
        mountPoint: '/',
        network: false,
        totalBytes: 494 * GB,
        freeBytes: 213 * GB
      }
    ],
    addresses: [{ name: 'en0', address: '192.168.0.11' }],
    env: [
      { name: 'PATH', value: '/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin' },
      { name: 'JAVA_HOME' }
    ],
    tools: [
      { name: 'git', version: '2.47.1' },
      { name: 'node', version: '22.11.0' },
      { name: 'python', version: '3.13.0' },
      { name: 'java' },
      { name: 'go', version: '1.23.3' }
    ],
    app,
    problems: []
  }
}
