import { describe, expect, it } from 'vitest'
import { loadConsoleRules } from '.'
import { errorMessage, loadFiles, loadItems, memoryReader, TEST_DIR } from './testing'

const CONFIG = 'launcher/config.yaml'
const LOCAL = 'launcher/config.local.yaml'

describe('loadProject', () => {
  it('ページと項目を読み、include を展開する', async () => {
    const r = await loadFiles({
      [CONFIG]: `
version: 1
title: Sample
cwd: ../scripts
style: launcher/style.css
pages:
  - id: top
    title: メイン
    items:
      - bat: build.bat
        sh: ./build.sh
        label: ビルド
  - include: launcher/pages/tools.yaml
`,
      'launcher/pages/tools.yaml': `
id: tools
items:
  - url: https://example.com/search
    params: { q: あいうえお, n: 10 }
`
    })
    expect(r.diagnostics).toEqual([])
    expect(r.project?.title).toBe('Sample')
    expect(r.project?.styles).toEqual(['launcher/style.css'])
    expect(r.project?.scripts).toEqual(['launcher/scripts'])
    expect(r.project?.cwd).toBe('../scripts')
    expect(r.project?.pages.map((p) => p.id)).toEqual(['top', 'tools'])
    expect(r.project?.pages[0].items[0]).toMatchObject({
      kind: 'exec',
      scripts: { bat: 'build.bat', sh: './build.sh' },
      label: 'ビルド'
    })
    expect(r.project?.pages[1].items[0]).toMatchObject({
      kind: 'url',
      params: { q: 'あいうえお', n: '10' }
    })
  })

  it('config.yaml が無ければエラーだけ返す', async () => {
    const r = await loadFiles({})
    expect(r.project).toBeUndefined()
    expect(r.diagnostics[0]).toMatchObject({ level: 'error', file: CONFIG })
  })

  it('YAML の構文エラーは行番号つきで返し、ページは出さない', async () => {
    const r = await loadFiles({ [CONFIG]: 'version: 1\npages:\n  - id: top\n   items: [' })
    expect(r.project).toBeUndefined()
    expect(r.diagnostics[0].line).toBeGreaterThan(0)
  })

  it('対応していない version はページを出さない', async () => {
    const r = await loadFiles({ [CONFIG]: 'version: 2\npages: []' })
    expect(r.project).toBeUndefined()
  })

  it('未知のキーは警告にとどめる', async () => {
    const r = await loadFiles({
      [CONFIG]:
        'version: 1\nfuture: 1\npages:\n  - id: top\n    items:\n      - open: a\n        color: red'
    })
    expect(r.project?.pages[0].items[0].kind).toBe('open')
    expect(r.diagnostics.map((d) => d.level)).toEqual(['warning', 'warning'])
  })

  it('include 先が無い・ページ ID が不正なら、そのページを飛ばす', async () => {
    const r = await loadFiles({
      [CONFIG]: 'version: 1\npages:\n  - include: none.yaml\n  - id: "a b"\n  - id: ok'
    })
    expect(r.project?.pages.map((p) => p.id)).toEqual(['ok'])
    expect(r.diagnostics.filter((d) => d.level === 'error')).toHaveLength(2)
  })
})

describe('項目', () => {
  it('function は scripts.js の関数名として読む', async () => {
    const { items } = await loadItems('- function: hello')
    expect(items).toEqual([{ kind: 'function', fn: 'hello' }])
  })

  it('break と heading を読む', async () => {
    const { items } = await loadItems('- break\n- break:\n- heading: ビルド')
    expect(items).toMatchObject([
      { kind: 'break' },
      { kind: 'break' },
      { kind: 'heading', text: 'ビルド' }
    ])
  })

  it('md は1行で .md で終わればファイル、それ以外は本文', async () => {
    const { items } = await loadItems(`
- md: launcher/notes/release.md
- md: |
    docs/a.md
- md: "**注意** docs/a.md を見る。"
- md: |
    # 見出し
    docs/a.md
`)
    expect(items).toMatchObject([
      { kind: 'mdfile', path: 'launcher/notes/release.md' },
      { kind: 'mdfile', path: 'docs/a.md' },
      { kind: 'markdown', content: '**注意** docs/a.md を見る。' },
      { kind: 'markdown', content: '# 見出し\ndocs/a.md\n' }
    ])
  })

  it('group・buttons・select を読む', async () => {
    const { items, diagnostics } = await loadItems(`
- group: 資料
  icon: folder
  items:
    - buttons:
        - excel: a.xlsx
        - { excel: a.xlsx, readonly: true, label: 読取専用 }
    - select: env
      label: 接続先
      options: [dev, { label: 本番, value: prod }, 1]
      default: prod
      remember: true
- group:
  items: []
`)
    expect(diagnostics).toEqual([])
    expect(items).toMatchObject([
      {
        kind: 'group',
        title: '資料',
        icon: 'folder',
        items: [
          {
            kind: 'buttons',
            items: [
              { kind: 'excel', path: 'a.xlsx', readonly: false },
              { kind: 'excel', readonly: true, label: '読取専用' }
            ]
          },
          {
            kind: 'select',
            id: 'env',
            name: 'env',
            control: 'select',
            label: '接続先',
            options: [
              { label: 'dev', value: 'dev' },
              { label: '本番', value: 'prod' },
              { label: '1', value: '1' }
            ],
            default: 'prod',
            remember: true
          }
        ]
      },
      { kind: 'group', items: [] }
    ])
    expect(items[1]).toEqual({ kind: 'group', items: [] })
  })

  it('radio・checkbox は表示の違う select として読む', async () => {
    const { items, diagnostics } = await loadItems(`
- { radio: mode, options: [debug, release], default: release, remember: true }
- { checkbox: dry, label: 試しに実行, on: --dry-run, off: '' }
- { checkbox: force, default: true }
`)
    expect(diagnostics).toEqual([])
    const select = { kind: 'select', remember: false }
    expect(items).toEqual([
      {
        ...select,
        id: 'mode',
        name: 'mode',
        control: 'radio',
        options: [
          { label: 'debug', value: 'debug' },
          { label: 'release', value: 'release' }
        ],
        default: 'release',
        remember: true
      },
      {
        ...select,
        id: 'dry',
        name: 'dry',
        control: 'checkbox',
        label: '試しに実行',
        options: [
          { label: 'on', value: '--dry-run' },
          { label: 'off', value: '' }
        ],
        default: ''
      },
      {
        ...select,
        id: 'force',
        name: 'force',
        control: 'checkbox',
        options: [
          { label: 'on', value: 'true' },
          { label: 'off', value: 'false' }
        ],
        default: 'true'
      }
    ])
  })

  it('select・radio・checkbox の change は関数名として読む', async () => {
    const { items, diagnostics } = await loadItems(`
- { select: env, options: [dev], change: onEnvChange }
- { radio: mode, options: [a], change: onModeChange }
- { checkbox: dry, change: onDryChange }
`)
    expect(diagnostics).toEqual([])
    expect(items.map((i) => i.kind === 'select' && i.change)).toEqual([
      'onEnvChange',
      'onModeChange',
      'onDryChange'
    ])
  })
})

describe('項目の誤りは、その項目だけエラーにする', () => {
  it.each([
    ['種類キーが無い', '- label: 種類なし', '種類なし: 種類キーがありません'],
    ['button は種類キーではない', '- button: hello', '種類キーがありません'],
    ['markdown は種類キーではない', '- markdown: "# 旧"', '種類キーがありません'],
    ['mdfile は種類キーではない', '- mdfile: a.md', '種類キーがありません'],
    ['種類キーが2つ', '- { excel: a.xlsx, open: b }', '種類キーが複数あります'],
    ['bat と sh 以外の併記', '- { bat: a, powershell: b }', '併記できるのは bat と sh だけ'],
    ['readonly が真偽値でない', '- { excel: a.xlsx, readonly: "yes" }', 'readonly は true / false'],
    ['heading の値が無い', '- heading:', 'heading'],
    ['buttons が並びでない', '- buttons: a', 'buttons にはボタンを'],
    ['select の ID', "- { select: 'a b', options: [x] }", 'select の ID が正しくありません'],
    ['select の options が無い', '- { select: s }', 'options で選択肢を'],
    [
      'default が options に無い',
      '- { select: s, options: [x], default: y }',
      'default が options にありません'
    ],
    ['radio の options が無い', '- { radio: m }', 'radio には options で選択肢を'],
    ['checkbox の on と off が同じ', '- { checkbox: c, on: x, off: x }', 'on と off が同じ値です'],
    ['checkbox の default', '- { checkbox: c, default: yes }', 'default は true / false']
  ])('%s', async (_, yaml, message) => {
    const { items } = await loadItems(`${yaml}\n- md: "# OK"`)
    expect(errorMessage(items[0])).toEqual(expect.stringContaining(message))
    expect(items[1].kind).toBe('markdown')
  })

  it('グループの中のグループ、ボタングループの中のボタンでない項目', async () => {
    const { items } = await loadItems(`
- group: 外
  items:
    - { group: 内, items: [] }
- buttons:
    - { open: a }
    - { heading: 見出し }
    - { select: s, options: [a] }
    - { checkbox: c }
`)
    expect(items[0]).toMatchObject({
      kind: 'group',
      items: [{ kind: 'error', message: expect.stringContaining('グループの中にグループ') }]
    })
    expect(items[1]).toMatchObject({
      kind: 'buttons',
      items: [
        { kind: 'open' },
        { kind: 'error', message: expect.stringContaining('heading は置けません') },
        { kind: 'error', message: expect.stringContaining('select は置けません') },
        { kind: 'error', message: expect.stringContaining('checkbox は置けません') }
      ]
    })
  })

  it('checkbox に options は書けない（警告にとどめる）', async () => {
    const { items, diagnostics } = await loadItems('- { checkbox: c, options: [a] }')
    expect(errorMessage(items[0])).toBe(false)
    expect(diagnostics.map((d) => d.message)).toContainEqual(expect.stringContaining('options'))
  })
})

describe('info', () => {
  it('組み込みに無いツールは command が要る', async () => {
    const r = await loadFiles({
      [CONFIG]: `
version: 1
pages: []
info:
  tools:
    - git
    - mvn
    - { name: Maven, command: mvn -v, pattern: "Maven ([\\\\d.]+)" }
`
    })
    expect(r.project?.info.tools.map((t) => t.name)).toEqual(['git', 'Maven'])
    expect(r.diagnostics).toHaveLength(1)
  })

  it('ローカルの同じ名前のツールは置き換え、新しいツールは足す', async () => {
    const r = await loadFiles({
      [CONFIG]: 'version: 1\npages: []\ninfo:\n  tools: [git, node]\n  env: [PATH]',
      [LOCAL]:
        'info:\n  tools:\n    - { name: node, command: node -v }\n    - java\n  env: [PATH, HOME]'
    })
    expect(r.project?.info.tools).toEqual([
      { name: 'git' },
      { name: 'node', command: 'node -v', pattern: undefined },
      { name: 'java' }
    ])
    expect(r.project?.info.env).toEqual(['PATH', 'HOME'])
  })

  it('ローカルで hidden: true を書いたツールは出さない（組み込みに無い名前でも command は要らない）', async () => {
    const r = await loadFiles({
      [CONFIG]: `
version: 1
pages: []
info:
  tools:
    - git
    - node
    - { name: Maven, command: mvn -v }
`,
      [LOCAL]:
        'info:\n  tools:\n    - { name: node, hidden: true }\n    - { name: Maven, hidden: true }'
    })
    expect(r.project?.info.tools.map((t) => t.name)).toEqual(['git'])
    expect(r.diagnostics).toEqual([])
  })

  it('レジストリはパスだけか { name, path }。ローカルは同じパスを上書きする', async () => {
    const r = await loadFiles({
      [CONFIG]: `
version: 1
pages: []
info:
  registry:
    - HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem\\LongPathsEnabled
    - { name: JDK, path: HKLM\\SOFTWARE\\JavaSoft\\JDK\\CurrentVersion }
    - HKCU\\Software\\Example\\
    - SOFTWARE\\NoHive
`,
      [LOCAL]: `
info:
  registry:
    - { name: 長いパス, path: HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem\\LongPathsEnabled }
`
    })
    expect(r.project?.info.registry).toEqual([
      {
        name: '長いパス',
        path: 'HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem\\LongPathsEnabled'
      },
      { name: 'JDK', path: 'HKLM\\SOFTWARE\\JavaSoft\\JDK\\CurrentVersion' },
      { name: 'Example', path: 'HKCU\\Software\\Example\\' }
    ])
    expect(r.diagnostics).toMatchObject([
      { level: 'error', message: expect.stringContaining('NoHive') }
    ])
  })
})

describe('ローカル設定', () => {
  it('id はグループ・ボタングループの中の項目も置き換える', async () => {
    const { items, diagnostics } = await loadItems(
      `
- group: 資料
  items:
    - buttons:
        - { id: spec, excel: a.xlsx }
    - { select: env, options: [dev, stg] }
`,
      {
        [LOCAL]: `
pages:
  - id: top
    items:
      - { id: spec, excel: mine.xlsx }
      - { select: env, options: [dev, local] }
      - { open: new }
`
      }
    )
    expect(diagnostics).toEqual([])
    expect(items).toMatchObject([
      {
        kind: 'group',
        items: [
          { kind: 'buttons', items: [{ path: 'mine.xlsx' }] },
          { kind: 'select', options: [{ value: 'dev' }, { value: 'local' }] }
        ]
      },
      { kind: 'open', path: 'new' }
    ])
  })

  it('最上位・ページ・項目を合成する', async () => {
    const r = await loadFiles({
      [CONFIG]: `
version: 1
pages:
  - id: top
    items:
      - { id: build, bat: build.bat }
      - { open: docs }
  - id: tools
    replace: true
    items:
      - { open: a }
`,
      [LOCAL]: `
cwd: D:/work
style: my.css
scripts: [launcher/scripts, mine.js]
pages:
  - id: top
    items:
      - { id: build, bat: my-build.bat }
      - { open: mine }
  - id: tools
    replace: true
    items:
      - { open: b }
  - id: personal
    items: []
`
    })
    expect(r.diagnostics).toEqual([])
    const p = r.project!
    expect(p.cwd).toBe('D:/work')
    expect(p.styles).toEqual(['my.css'])
    expect(p.scripts).toEqual(['launcher/scripts', 'mine.js'])
    expect(p.pages.map((x) => x.id)).toEqual(['top', 'tools', 'personal'])
    expect(p.pages[0].items).toMatchObject([
      { kind: 'exec', scripts: { bat: 'my-build.bat' } },
      { kind: 'open', path: 'docs' },
      { kind: 'open', path: 'mine' }
    ])
    expect(p.pages[1].items).toMatchObject([{ path: 'b' }])
    expect(p.pages.some((x) => 'replace' in x)).toBe(false)
  })
})

describe('loadConsoleRules', () => {
  it('個人用を先に並べ、誤ったルールは飛ばす', async () => {
    const r = await loadConsoleRules(
      TEST_DIR,
      memoryReader({
        'launcher/console.yaml': `
rules:
  - { pattern: "error", level: error }
  - { pattern: "(", level: warn }
  - { pattern: "x", level: loud }
`,
        'launcher/console.local.yaml': 'rules:\n  - { pattern: "mine", color: "#f00" }'
      })
    )
    expect(r.rules).toEqual([
      { pattern: 'mine', flags: undefined, level: 'info', color: '#f00' },
      { pattern: 'error', flags: undefined, level: 'error', color: undefined }
    ])
    expect(r.diagnostics).toHaveLength(2)
  })
})

describe('openSchemes', () => {
  const top = 'pages:\n  - id: top\n    items: []\n'

  it('省略したら undefined（既定を使う）', async () => {
    const r = await loadFiles({ [CONFIG]: `version: 1\n${top}` })
    expect(r.project?.openSchemes).toBeUndefined()
  })

  it('正規化して読み、重複を除く', async () => {
    const r = await loadFiles({
      [CONFIG]: `version: 1\nopenSchemes: [HTTPS, 'file:', https]\n${top}`
    })
    expect(r.diagnostics).toEqual([])
    expect(r.project?.openSchemes).toEqual(['https', 'file'])
  })

  it('スキームとして書けないものはエラーにし、残りを使う', async () => {
    const r = await loadFiles({
      [CONFIG]: `version: 1\nopenSchemes: [https, 'http://', 3]\n${top}`
    })
    expect(r.project?.openSchemes).toEqual(['https'])
    expect(r.diagnostics.map((d) => d.message)).toEqual([
      'openSchemes にはスキーム名（http・file など）を並べてください: http://',
      'openSchemes にはスキーム名（http・file など）を並べてください: 3'
    ])
  })

  it('javascript などは書けない', async () => {
    const r = await loadFiles({
      [CONFIG]: `version: 1\nopenSchemes: [https, JavaScript, data]\n${top}`
    })
    expect(r.project?.openSchemes).toEqual(['https'])
    expect(r.diagnostics.map((d) => d.message)).toEqual([
      'openSchemes に javascript は書けません',
      'openSchemes に data は書けません'
    ])
  })

  it('空の並びなら何も開かない', async () => {
    const r = await loadFiles({ [CONFIG]: `version: 1\nopenSchemes: []\n${top}` })
    expect(r.project?.openSchemes).toEqual([])
  })

  it('ローカル設定に書いたら置き換える', async () => {
    const r = await loadFiles({
      [CONFIG]: `version: 1\nopenSchemes: [https]\n${top}`,
      [LOCAL]: 'openSchemes: [http, https, file]\n'
    })
    expect(r.project?.openSchemes).toEqual(['http', 'https', 'file'])
    const kept = await loadFiles({
      [CONFIG]: `version: 1\nopenSchemes: [https]\n${top}`,
      [LOCAL]: 'title: mine\n'
    })
    expect(kept.project?.openSchemes).toEqual(['https'])
  })
})
