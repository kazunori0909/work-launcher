import type { Item } from '../../../core/types'

// ヘルプに載せる書き方の例。yaml は items: の下に書く内容で、items はそれを読み込んだ結果。
// 見本のボタンは items から描くので、両者がずれないことを examples.test.ts で確かめる

export interface Example {
  yaml: string
  items: Item[]
}

export const EXAMPLES = {
  exec: {
    yaml: `- bat: build.bat
  label: ビルド
  icon: hammer`,
    items: [{ kind: 'exec', scripts: { bat: 'build.bat' }, label: 'ビルド', icon: 'hammer' }]
  },
  execOptions: {
    yaml: `- sh: |
    ./setup.sh
    ./build.sh --release
  label: リリースビルド
  cwd: tools
  env:
    BUILD_MODE: release
  confirm: リリースビルドを実行しますか？`,
    items: [
      {
        kind: 'exec',
        scripts: { sh: './setup.sh\n./build.sh --release\n' },
        label: 'リリースビルド',
        cwd: 'tools',
        env: { BUILD_MODE: 'release' },
        confirm: 'リリースビルドを実行しますか？'
      }
    ]
  },
  execScripts: {
    yaml: `- powershell: |
    $files = Get-ChildItem -File
    Write-Output "ファイル数: $($files.Count)"
  label: ファイルを数える
- python: |
    import platform
    print(f"Python {platform.python_version()}")
  label: Python のバージョン`,
    items: [
      {
        kind: 'exec',
        scripts: {
          powershell: '$files = Get-ChildItem -File\nWrite-Output "ファイル数: $($files.Count)"\n'
        },
        label: 'ファイルを数える'
      },
      {
        kind: 'exec',
        scripts: { python: 'import platform\nprint(f"Python {platform.python_version()}")\n' },
        label: 'Python のバージョン'
      }
    ]
  },
  open: {
    yaml: `- open: docs
  label: 資料フォルダ
  icon: folder-open
- open: \${launcherDir}/README.md
  icon: file-text`,
    items: [
      { kind: 'open', path: 'docs', label: '資料フォルダ', icon: 'folder-open' },
      { kind: 'open', path: '${launcherDir}/README.md', icon: 'file-text' }
    ]
  },
  office: {
    yaml: `- excel: docs/仕様書.xlsx
  readonly: true
- powerpoint: docs/説明.pptx
- word: docs/手順書.docx`,
    items: [
      { kind: 'excel', path: 'docs/仕様書.xlsx', readonly: true },
      { kind: 'powerpoint', path: 'docs/説明.pptx', readonly: false },
      { kind: 'word', path: 'docs/手順書.docx', readonly: false }
    ]
  },
  url: {
    yaml: `- url: https://www.google.com/search
  params:
    q: WorkLauncher 使い方
  label: 検索
  icon: search`,
    items: [
      {
        kind: 'url',
        url: 'https://www.google.com/search',
        params: { q: 'WorkLauncher 使い方' },
        label: '検索',
        icon: 'search'
      }
    ]
  },
  function: {
    yaml: `- function: openLogFolder
  label: ログを開く
  icon: scroll-text`,
    items: [{ kind: 'function', fn: 'openLogFolder', label: 'ログを開く', icon: 'scroll-text' }]
  },
  embed: {
    yaml: `- md: |
    **ビルドの前に** VPN につなぐ。手順は [setup.md](docs/setup.md)
- html: |
    <span style="color: #cf222e">本番環境に注意</span>`,
    items: [
      {
        kind: 'markdown',
        content: '**ビルドの前に** VPN につなぐ。手順は [setup.md](docs/setup.md)\n'
      },
      { kind: 'html', content: '<span style="color: #cf222e">本番環境に注意</span>\n' }
    ]
  },
  layout: {
    yaml: `- heading: ビルド
- { bat: build.bat, label: ビルド }
- { bat: test.bat, label: テスト }
- break
- { bat: clean.bat }
- heading: 資料
- { open: docs, label: 資料フォルダ }`,
    items: [
      { kind: 'heading', text: 'ビルド' },
      { kind: 'exec', scripts: { bat: 'build.bat' }, label: 'ビルド' },
      { kind: 'exec', scripts: { bat: 'test.bat' }, label: 'テスト' },
      { kind: 'break' },
      { kind: 'exec', scripts: { bat: 'clean.bat' } },
      { kind: 'heading', text: '資料' },
      { kind: 'open', path: 'docs', label: '資料フォルダ' }
    ]
  },
  group: {
    yaml: `- group: # 見出しなし
  items:
    - { bat: build.bat, label: ビルド }
    - { bat: test.bat, label: テスト }
- group: 資料
  icon: folder
  items:
    - { open: docs, label: 資料フォルダ }`,
    items: [
      {
        kind: 'group',
        items: [
          { kind: 'exec', scripts: { bat: 'build.bat' }, label: 'ビルド' },
          { kind: 'exec', scripts: { bat: 'test.bat' }, label: 'テスト' }
        ]
      },
      {
        kind: 'group',
        title: '資料',
        icon: 'folder',
        items: [{ kind: 'open', path: 'docs', label: '資料フォルダ' }]
      }
    ]
  },
  buttons: {
    yaml: `- buttons:
    - excel: docs/見積書.xlsx
      readonly: true
    - excel: docs/見積書.xlsx
      label: ''
      icon: pencil-line
      tooltip: 編集モードで開く`,
    items: [
      {
        kind: 'buttons',
        items: [
          { kind: 'excel', path: 'docs/見積書.xlsx', readonly: true },
          {
            kind: 'excel',
            path: 'docs/見積書.xlsx',
            readonly: false,
            label: '',
            icon: 'pencil-line',
            tooltip: '編集モードで開く'
          }
        ]
      }
    ]
  },
  select: {
    yaml: `- select: target
  label: 接続先
  options:
    - dev
    - { label: 本番, value: prod }
  remember: true
- sh: ./deploy.sh \${select:target}
  label: デプロイ
  confirm: \${select:target} にデプロイしますか？`,
    items: [
      {
        kind: 'select',
        id: 'target',
        name: 'target',
        control: 'select',
        label: '接続先',
        options: [
          { label: 'dev', value: 'dev' },
          { label: '本番', value: 'prod' }
        ],
        remember: true
      },
      {
        kind: 'exec',
        scripts: { sh: './deploy.sh ${select:target}' },
        label: 'デプロイ',
        confirm: '${select:target} にデプロイしますか？'
      }
    ]
  },
  radio: {
    yaml: `- radio: mode
  label: モード
  options: [debug, release]
  default: release
- sh: ./build.sh \${select:mode}
  label: ビルド`,
    items: [
      {
        kind: 'select',
        id: 'mode',
        name: 'mode',
        control: 'radio',
        label: 'モード',
        options: [
          { label: 'debug', value: 'debug' },
          { label: 'release', value: 'release' }
        ],
        default: 'release',
        remember: false
      },
      { kind: 'exec', scripts: { sh: './build.sh ${select:mode}' }, label: 'ビルド' }
    ]
  },
  checkbox: {
    yaml: `- checkbox: dry
  label: 試しに実行
  on: --dry-run
  off: ''
  default: true
- sh: ./deploy.sh \${select:dry}
  label: デプロイ`,
    items: [
      {
        kind: 'select',
        id: 'dry',
        name: 'dry',
        control: 'checkbox',
        label: '試しに実行',
        options: [
          { label: 'on', value: '--dry-run' },
          { label: 'off', value: '' }
        ],
        default: '--dry-run',
        remember: false
      },
      { kind: 'exec', scripts: { sh: './deploy.sh ${select:dry}' }, label: 'デプロイ' }
    ]
  }
} satisfies Record<string, Example>

/** チートシートの1行。name は種類、note は一言の説明 */
export interface Cheat extends Example {
  name: string
  note: string
}

const exec = (kind: string, script: string, label: string): Item => ({
  kind: 'exec',
  scripts: { [kind]: script },
  label
})

/** 「ボタンを追加」の先頭に出す早見表。省略できる属性は書かない */
export const ITEM_CHEATS: Cheat[] = [
  {
    name: 'bat',
    note: 'cmd で実行（Windows）',
    yaml: '- { bat: build.bat, label: ビルド }',
    items: [exec('bat', 'build.bat', 'ビルド')]
  },
  {
    name: 'sh',
    note: 'bash で実行',
    yaml: '- { sh: ./build.sh, label: ビルド }',
    items: [exec('sh', './build.sh', 'ビルド')]
  },
  {
    name: 'powershell',
    note: 'PowerShell で実行',
    yaml: '- { powershell: Get-Date, label: 日付 }',
    items: [exec('powershell', 'Get-Date', '日付')]
  },
  {
    name: 'python',
    note: 'Python で実行',
    yaml: '- { python: main.py, label: 実行 }',
    items: [exec('python', 'main.py', '実行')]
  },
  {
    name: 'open',
    note: 'ファイル・フォルダを開く',
    yaml: '- open: docs',
    items: [{ kind: 'open', path: 'docs' }]
  },
  {
    name: 'excel / powerpoint / word',
    note: 'Office で開く',
    yaml: '- excel: docs/仕様書.xlsx',
    items: [{ kind: 'excel', path: 'docs/仕様書.xlsx', readonly: false }]
  },
  {
    name: 'url',
    note: 'ブラウザで開く',
    yaml: '- url: https://example.com',
    items: [{ kind: 'url', url: 'https://example.com' }]
  },
  {
    name: 'function',
    note: 'JS の関数を呼ぶ',
    yaml: '- function: openLogFolder',
    items: [{ kind: 'function', fn: 'openLogFolder' }]
  },
  {
    name: 'md',
    note: 'Markdown の文章',
    yaml: '- md: "**太字** の説明"',
    items: [{ kind: 'markdown', content: '**太字** の説明' }]
  },
  {
    name: 'html',
    note: 'HTML の文章',
    yaml: '- html: <b>注意</b>',
    items: [{ kind: 'html', content: '<b>注意</b>' }]
  },
  {
    name: 'heading',
    note: '見出し',
    yaml: '- heading: ビルド',
    items: [{ kind: 'heading', text: 'ビルド' }]
  },
  {
    name: 'break',
    note: 'ここで改行',
    yaml: `- { bat: a.bat }
- break
- { bat: b.bat }`,
    items: [
      { kind: 'exec', scripts: { bat: 'a.bat' } },
      { kind: 'break' },
      { kind: 'exec', scripts: { bat: 'b.bat' } }
    ]
  }
]

/** 「ボタン以外の要素」の先頭に出す早見表。値は ${select:ID} で使う */
export const ELEMENT_CHEATS: Cheat[] = [
  {
    name: 'select',
    note: 'ドロップダウンで1つ選ぶ',
    yaml: '- select: target\n  options: [dev, prod]',
    items: [
      {
        kind: 'select',
        id: 'target',
        name: 'target',
        control: 'select',
        options: [
          { label: 'dev', value: 'dev' },
          { label: 'prod', value: 'prod' }
        ],
        remember: false
      }
    ]
  },
  {
    name: 'radio',
    note: '横に並べて1つ選ぶ',
    yaml: '- radio: mode\n  options: [debug, release]',
    items: [
      {
        kind: 'select',
        id: 'mode',
        name: 'mode',
        control: 'radio',
        options: [
          { label: 'debug', value: 'debug' },
          { label: 'release', value: 'release' }
        ],
        remember: false
      }
    ]
  },
  {
    name: 'checkbox',
    note: 'オン・オフ（既定の値は true / false）',
    yaml: '- checkbox: dry\n  label: 試しに実行',
    items: [
      {
        kind: 'select',
        id: 'dry',
        name: 'dry',
        control: 'checkbox',
        label: '試しに実行',
        options: [
          { label: 'on', value: 'true' },
          { label: 'off', value: 'false' }
        ],
        remember: false
      }
    ]
  }
]
