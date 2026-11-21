import { exec, EXAMPLES } from './examples'
import type { Cheat, Example } from './examples'

// 英語のヘルプの書き方の例。キーと並びは examples.ts（日本語）に合わせる。
// yaml と items がずれないことは examples.test.ts で確かめる

export const EXAMPLES_EN = {
  exec: {
    yaml: `- bat: build.bat
  label: Build
  icon: hammer`,
    items: [{ kind: 'exec', scripts: { bat: 'build.bat' }, label: 'Build', icon: 'hammer' }]
  },
  execOptions: {
    yaml: `- sh: |
    ./setup.sh
    ./build.sh --release
  label: Release build
  cwd: tools
  env:
    BUILD_MODE: release
  confirm: Run the release build?`,
    items: [
      {
        kind: 'exec',
        scripts: { sh: './setup.sh\n./build.sh --release\n' },
        label: 'Release build',
        cwd: 'tools',
        env: { BUILD_MODE: 'release' },
        confirm: 'Run the release build?'
      }
    ]
  },
  execScripts: {
    yaml: `- powershell: |
    $files = Get-ChildItem -File
    Write-Output "Files: $($files.Count)"
  label: Count files
- python: |
    import platform
    print(f"Python {platform.python_version()}")
  label: Python version`,
    items: [
      {
        kind: 'exec',
        scripts: {
          powershell: '$files = Get-ChildItem -File\nWrite-Output "Files: $($files.Count)"\n'
        },
        label: 'Count files'
      },
      {
        kind: 'exec',
        scripts: { python: 'import platform\nprint(f"Python {platform.python_version()}")\n' },
        label: 'Python version'
      }
    ]
  },
  open: {
    yaml: `- open: docs
  label: Documents
  icon: folder-open
- open: \${launcherDir}/README.md
  icon: file-text`,
    items: [
      { kind: 'open', path: 'docs', label: 'Documents', icon: 'folder-open' },
      { kind: 'open', path: '${launcherDir}/README.md', icon: 'file-text' }
    ]
  },
  office: {
    yaml: `- excel: docs/spec.xlsx
  readonly: true
- powerpoint: docs/overview.pptx
- word: docs/manual.docx`,
    items: [
      { kind: 'excel', path: 'docs/spec.xlsx', readonly: true },
      { kind: 'powerpoint', path: 'docs/overview.pptx', readonly: false },
      { kind: 'word', path: 'docs/manual.docx', readonly: false }
    ]
  },
  url: {
    yaml: `- url: https://www.google.com/search
  params:
    q: WorkLauncher how to
  label: Search
  icon: search`,
    items: [
      {
        kind: 'url',
        url: 'https://www.google.com/search',
        params: { q: 'WorkLauncher how to' },
        label: 'Search',
        icon: 'search'
      }
    ]
  },
  function: {
    yaml: `- function: openLogFolder
  label: Open logs
  icon: scroll-text`,
    items: [{ kind: 'function', fn: 'openLogFolder', label: 'Open logs', icon: 'scroll-text' }]
  },
  embed: {
    yaml: `- md: |
    **Before building**, connect to the VPN. See [setup.md](docs/setup.md)
- html: |
    <span style="color: #cf222e">Careful: production</span>`,
    items: [
      {
        kind: 'markdown',
        content: '**Before building**, connect to the VPN. See [setup.md](docs/setup.md)\n'
      },
      { kind: 'html', content: '<span style="color: #cf222e">Careful: production</span>\n' }
    ]
  },
  layout: {
    yaml: `- heading: Build
- { bat: build.bat, label: Build }
- { bat: test.bat, label: Test }
- break
- { bat: clean.bat }
- heading: Documents
- { open: docs, label: Documents }`,
    items: [
      { kind: 'heading', text: 'Build' },
      { kind: 'exec', scripts: { bat: 'build.bat' }, label: 'Build' },
      { kind: 'exec', scripts: { bat: 'test.bat' }, label: 'Test' },
      { kind: 'break' },
      { kind: 'exec', scripts: { bat: 'clean.bat' } },
      { kind: 'heading', text: 'Documents' },
      { kind: 'open', path: 'docs', label: 'Documents' }
    ]
  },
  group: {
    yaml: `- group: # no heading
  items:
    - { bat: build.bat, label: Build }
    - { bat: test.bat, label: Test }
- group: Documents
  icon: folder
  items:
    - { open: docs, label: Documents }`,
    items: [
      {
        kind: 'group',
        items: [
          { kind: 'exec', scripts: { bat: 'build.bat' }, label: 'Build' },
          { kind: 'exec', scripts: { bat: 'test.bat' }, label: 'Test' }
        ]
      },
      {
        kind: 'group',
        title: 'Documents',
        icon: 'folder',
        items: [{ kind: 'open', path: 'docs', label: 'Documents' }]
      }
    ]
  },
  buttons: {
    yaml: `- buttons:
    - excel: docs/estimate.xlsx
      readonly: true
    - excel: docs/estimate.xlsx
      label: ''
      icon: pencil-line
      tooltip: Open for editing`,
    items: [
      {
        kind: 'buttons',
        items: [
          { kind: 'excel', path: 'docs/estimate.xlsx', readonly: true },
          {
            kind: 'excel',
            path: 'docs/estimate.xlsx',
            readonly: false,
            label: '',
            icon: 'pencil-line',
            tooltip: 'Open for editing'
          }
        ]
      }
    ]
  },
  select: {
    yaml: `- select: target
  label: Target
  options:
    - dev
    - { label: Production, value: prod }
  remember: true
- sh: ./deploy.sh \${select:target}
  label: Deploy
  confirm: Deploy to \${select:target}?`,
    items: [
      {
        kind: 'select',
        id: 'target',
        name: 'target',
        control: 'select',
        label: 'Target',
        options: [
          { label: 'dev', value: 'dev' },
          { label: 'Production', value: 'prod' }
        ],
        remember: true
      },
      {
        kind: 'exec',
        scripts: { sh: './deploy.sh ${select:target}' },
        label: 'Deploy',
        confirm: 'Deploy to ${select:target}?'
      }
    ]
  },
  radio: {
    yaml: `- radio: mode
  label: Mode
  options: [debug, release]
  default: release
- sh: ./build.sh \${select:mode}
  label: Build`,
    items: [
      {
        kind: 'select',
        id: 'mode',
        name: 'mode',
        control: 'radio',
        label: 'Mode',
        options: [
          { label: 'debug', value: 'debug' },
          { label: 'release', value: 'release' }
        ],
        default: 'release',
        remember: false
      },
      { kind: 'exec', scripts: { sh: './build.sh ${select:mode}' }, label: 'Build' }
    ]
  },
  checkbox: {
    yaml: `- checkbox: dry
  label: Dry run
  on: --dry-run
  off: ''
  default: true
- sh: ./deploy.sh \${select:dry}
  label: Deploy`,
    items: [
      {
        kind: 'select',
        id: 'dry',
        name: 'dry',
        control: 'checkbox',
        label: 'Dry run',
        options: [
          { label: 'on', value: '--dry-run' },
          { label: 'off', value: '' }
        ],
        default: '--dry-run',
        remember: false
      },
      { kind: 'exec', scripts: { sh: './deploy.sh ${select:dry}' }, label: 'Deploy' }
    ]
  }
} satisfies Record<keyof typeof EXAMPLES, Example>

export const ITEM_CHEATS_EN: Cheat[] = [
  {
    name: 'bat',
    note: 'Run with cmd (Windows)',
    yaml: '- { bat: build.bat, label: Build }',
    items: [exec('bat', 'build.bat', 'Build')],
    more: [
      {
        yaml: `- bat: |
    cd docs
    dir
  label: Documents`,
        items: [exec('bat', 'cd docs\ndir\n', 'Documents')]
      }
    ]
  },
  {
    name: 'sh',
    note: 'Run with bash',
    yaml: '- { sh: ./build.sh, label: Build }',
    items: [exec('sh', './build.sh', 'Build')]
  },
  {
    name: 'powershell',
    note: 'Run with PowerShell',
    yaml: '- { powershell: Get-Date, label: Date }',
    items: [exec('powershell', 'Get-Date', 'Date')]
  },
  {
    name: 'python',
    note: 'Run with Python',
    yaml: '- { python: main.py, label: Run }',
    items: [exec('python', 'main.py', 'Run')]
  },
  {
    name: 'open',
    note: 'Open a file or folder',
    yaml: '- open: docs',
    items: [{ kind: 'open', path: 'docs' }]
  },
  {
    name: 'excel / powerpoint / word',
    note: 'Open in Office',
    yaml: '- excel: docs/spec.xlsx',
    items: [{ kind: 'excel', path: 'docs/spec.xlsx', readonly: false }]
  },
  {
    name: 'url',
    note: 'Open in the browser',
    yaml: '- url: https://example.com',
    items: [{ kind: 'url', url: 'https://example.com' }]
  },
  {
    name: 'function',
    note: 'Call a JS function',
    yaml: '- function: openLogFolder',
    items: [{ kind: 'function', fn: 'openLogFolder' }]
  }
]

export const ELEMENT_CHEATS_EN: Cheat[] = [
  {
    name: 'select',
    note: 'Pick one from a drop-down',
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
    note: 'Pick one from a row',
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
    note: 'On or off (values default to true / false)',
    yaml: '- checkbox: dry\n  label: Dry run',
    items: [
      {
        kind: 'select',
        id: 'dry',
        name: 'dry',
        control: 'checkbox',
        label: 'Dry run',
        options: [
          { label: 'on', value: 'true' },
          { label: 'off', value: 'false' }
        ],
        remember: false
      }
    ]
  }
]

export const LAYOUT_CHEATS_EN: Cheat[] = [
  {
    name: 'heading',
    note: 'Heading',
    yaml: '- heading: Build',
    items: [{ kind: 'heading', text: 'Build' }]
  },
  {
    name: 'break',
    note: 'Line break here',
    yaml: `- { bat: a.bat }
- break
- { bat: b.bat }`,
    items: [
      { kind: 'exec', scripts: { bat: 'a.bat' } },
      { kind: 'break' },
      { kind: 'exec', scripts: { bat: 'b.bat' } }
    ]
  },
  {
    name: 'group',
    note: 'Draw a frame around items',
    yaml: `- group: Documents
  items:
    - open: docs`,
    items: [{ kind: 'group', title: 'Documents', items: [{ kind: 'open', path: 'docs' }] }]
  },
  {
    name: 'buttons',
    note: 'Join buttons together',
    yaml: `- buttons:
    - { bat: build.bat, label: Build }
    - { bat: test.bat, label: Test }`,
    items: [
      {
        kind: 'buttons',
        items: [exec('bat', 'build.bat', 'Build'), exec('bat', 'test.bat', 'Test')]
      }
    ]
  },
  {
    name: 'md',
    note: 'Markdown text',
    yaml: '- md: "**Bold** text"',
    items: [{ kind: 'markdown', content: '**Bold** text' }]
  },
  {
    name: 'html',
    note: 'HTML text',
    yaml: '- html: <b>Note</b>',
    items: [{ kind: 'html', content: '<b>Note</b>' }]
  }
]
