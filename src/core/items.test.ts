import { describe, expect, it } from 'vitest'
import {
  buildUrl,
  currentSelections,
  defaultIcon,
  execKindFor,
  expandSelect,
  itemAt,
  itemLabel,
  resolveSelections,
  walkItems
} from './items'
import type { Item, Project } from './types'

const envSelect: Item = {
  kind: 'select',
  id: 'env',
  name: 'env',
  control: 'select',
  options: [
    { label: 'dev', value: 'dev' },
    { label: '本番', value: 'prod' }
  ],
  remember: false
}
const nested: Item[] = [
  { kind: 'open', path: 'a' },
  {
    kind: 'group',
    items: [{ kind: 'buttons', items: [{ kind: 'open', path: 'b' }] }, envSelect]
  }
]

describe('walkItems・itemAt', () => {
  it('入れ子の項目も並び順で返し、位置の並びで探せる', () => {
    expect(walkItems(nested).map((i) => i.kind)).toEqual([
      'open',
      'group',
      'buttons',
      'open',
      'select'
    ])
    expect(itemAt(nested, [1, 0, 0])).toMatchObject({ path: 'b' })
    expect(itemAt(nested, [1, 1])).toBe(envSelect)
    expect(itemAt(nested, [0, 0])).toBeUndefined()
    expect(itemAt(nested, [5])).toBeUndefined()
  })
})

describe('resolveSelections', () => {
  const project = (items: Item[]): Project => ({
    styles: [],
    scripts: [],
    pages: [{ id: 'top', items }],
    info: { env: [], tools: [], registry: [] }
  })

  it('選択肢にある値だけ使い、無ければ既定値（default、無ければ最初の選択肢）', () => {
    expect(resolveSelections(project(nested), { env: 'prod' })).toEqual({ env: 'prod' })
    expect(resolveSelections(project(nested), { env: 'other', x: 'y' })).toEqual({ env: 'dev' })
    expect(resolveSelections(project(nested))).toEqual({ env: 'dev' })
    expect(resolveSelections(project([{ ...envSelect, default: 'prod' } as Item]))).toEqual({
      env: 'prod'
    })
  })
})

describe('currentSelections', () => {
  const remembered: Item = { ...envSelect, id: 'r', name: 'r', remember: true } as Item
  const p: Project = {
    styles: [],
    scripts: [],
    pages: [{ id: 'top', items: [envSelect, remembered] }],
    info: { env: [], tools: [], registry: [] }
  }

  it('選んだ値 → 記憶した値（remember: true だけ）→ 既定値', () => {
    expect(currentSelections(p)).toEqual({ env: 'dev', r: 'dev' })
    expect(currentSelections(p, { env: 'prod', r: 'prod' })).toEqual({ env: 'dev', r: 'prod' })
    expect(currentSelections(p, { r: 'prod' }, { r: 'dev', env: 'prod' })).toEqual({
      env: 'prod',
      r: 'dev'
    })
  })
})

describe('expandSelect', () => {
  it('select だけを置き換え、無い ID を返す', () => {
    const r = expandSelect('${select:env} ${env:X} $${select:env} ${select:no}', { env: 'prod' })
    expect(r).toEqual({ value: 'prod ${env:X} ${select:env} ', missing: ['no'] })
  })
})

describe('execKindFor', () => {
  it('bat と sh を併記すれば OS に合う方を選ぶ', () => {
    const scripts = { bat: 'a.bat', sh: './a.sh' }
    expect(execKindFor(scripts, 'win32')).toBe('bat')
    expect(execKindFor(scripts, 'darwin')).toBe('sh')
  })

  it('bat だけなら Mac では実行できない。sh だけなら Windows でも実行する', () => {
    expect(execKindFor({ bat: 'a.bat' }, 'darwin')).toBeUndefined()
    expect(execKindFor({ sh: 'a.sh' }, 'win32')).toBe('sh')
  })

  it('powershell と python はどの OS でも実行する', () => {
    expect(execKindFor({ powershell: 'x' }, 'darwin')).toBe('powershell')
    expect(execKindFor({ python: 'x' }, 'win32')).toBe('python')
  })
})

describe('itemLabel', () => {
  it('bat と sh を併記したら、この OS で実行する方の本文を使う', () => {
    const item = { kind: 'exec', scripts: { bat: 'echo bat', sh: 'echo sh' } } as const
    expect(itemLabel(item, 'darwin')).toBe('echo sh')
    expect(itemLabel(item, 'win32')).toBe('echo bat')
    expect(itemLabel({ kind: 'exec', scripts: { bat: 'dir' } }, 'darwin')).toBe('dir')
  })

  it('label が無ければ種類キーの値から作る', () => {
    expect(itemLabel({ kind: 'exec', scripts: { sh: '\n./build.sh --all\nnext' } }, 'darwin')).toBe(
      './build.sh --all'
    )
    expect(itemLabel({ kind: 'excel', path: 'docs\\仕様書.xlsx', readonly: false }, 'darwin')).toBe(
      '仕様書.xlsx'
    )
    expect(itemLabel({ kind: 'url', url: 'https://example.com/a?b=1' }, 'darwin')).toBe(
      'example.com'
    )
    expect(itemLabel({ kind: 'open', path: 'out/', label: 'Out' }, 'darwin')).toBe('Out')
  })
})

describe('itemLabel・defaultIcon（種類ごと）', () => {
  it.each<[Item, string, string | undefined]>([
    [{ kind: 'function', fn: 'hello' }, 'hello', 'code'],
    [{ kind: 'powerpoint', path: 'a/b.pptx', readonly: false }, 'b.pptx', 'presentation'],
    [{ kind: 'word', path: 'b.docx', readonly: false }, 'b.docx', 'file-text'],
    [{ kind: 'open', path: 'docs/a.pdf' }, 'a.pdf', 'file'],
    [{ kind: 'open', path: 'launcher/.launcher' }, '.launcher', 'folder-open'],
    [{ kind: 'url', url: 'https://example.com' }, 'example.com', 'globe'],
    [{ kind: 'html', content: '<b>a</b>' }, 'html', undefined],
    [{ kind: 'markdown', content: '# a' }, 'markdown', undefined],
    [{ kind: 'mdfile', path: 'docs/a.md' }, 'a.md', undefined],
    [{ kind: 'group', title: '資料', items: [] }, '資料', undefined],
    [{ kind: 'buttons', items: [] }, '', undefined],
    [envSelect, 'env', undefined],
    [{ kind: 'break' }, '', undefined],
    [{ kind: 'heading', text: '見出し' }, '見出し', undefined],
    [{ kind: 'error', message: 'x' }, 'エラー', undefined]
  ])('%o', (item, label, icon) => {
    expect(itemLabel(item, 'darwin')).toBe(label)
    expect(defaultIcon(item)).toBe(icon)
  })
})

describe('buildUrl', () => {
  it('params を URL エンコードして足す', () => {
    expect(buildUrl('https://www.google.com/search', { q: 'あいうえお' })).toBe(
      'https://www.google.com/search?q=%E3%81%82%E3%81%84%E3%81%86%E3%81%88%E3%81%8A'
    )
  })

  it('既にクエリがあれば & で後ろに足す', () => {
    expect(buildUrl('https://example.com/?a=1', { b: 'x y' })).toBe(
      'https://example.com/?a=1&b=x+y'
    )
  })

  it('不正な URL は例外にする', () => {
    expect(() => buildUrl('example.com')).toThrow()
  })
})

describe('defaultIcon', () => {
  it('種類ごとの既定のアイコン', () => {
    expect(defaultIcon({ kind: 'exec', scripts: { sh: 'ls' } })).toBe('terminal')
    expect(defaultIcon({ kind: 'url', url: 'https://example.com' })).toBe('globe')
    expect(defaultIcon({ kind: 'function', fn: 'hello' })).toBe('code')
    expect(defaultIcon({ kind: 'excel', path: 'a.xlsx', readonly: false })).toBe('file-spreadsheet')
  })

  it('open は拡張子があればファイル、無ければフォルダ', () => {
    expect(defaultIcon({ kind: 'open', path: 'docs/README.md' })).toBe('file')
    expect(defaultIcon({ kind: 'open', path: '.launcher' })).toBe('folder-open')
    expect(defaultIcon({ kind: 'open', path: '${launcherDir}\\logs\\' })).toBe('folder-open')
  })

  it('ボタンでない項目には付けない', () => {
    expect(defaultIcon({ kind: 'heading', text: '見出し' })).toBeUndefined()
    expect(defaultIcon({ kind: 'markdown', content: 'x' })).toBeUndefined()
  })
})
