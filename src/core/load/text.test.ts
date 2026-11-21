import { afterEach, describe, expect, it } from 'vitest'
import { setLang } from '../i18n'
import { CONFIG_FILE } from '.'
import { errorMessage, loadFiles, loadItems } from './testing'
import { pickText } from './text'

afterEach(() => setLang('ja'))

describe('pickText', () => {
  it('文字列はそのまま、表は表示中の言語、無ければ表の最初', () => {
    expect(pickText('ビルド', 'en')).toBe('ビルド')
    expect(pickText({ ja: 'ビルド', en: 'Build' }, 'en')).toBe('Build')
    expect(pickText({ ja: 'ビルド', en: 'Build' }, 'ja')).toBe('ビルド')
    expect(pickText({ ja: 'ビルド' }, 'en')).toBe('ビルド')
    expect(pickText({ en: 'Build' }, 'ja')).toBe('Build')
    expect(pickText({ zh: '构建', en: 'Build' }, 'ja')).toBe('构建')
  })

  it('文字列でも表でもなければ undefined', () => {
    expect(pickText(1)).toBeUndefined()
    expect(pickText(['a'])).toBeUndefined()
    expect(pickText({})).toBeUndefined()
    expect(pickText({ ja: 'a', en: 1 })).toBeUndefined()
  })
})

describe('言語の表で書いた設定', () => {
  const yaml = `
- bat: build.bat
  label: { ja: ビルド, en: Build }
  tooltip: { ja: 説明 }
  confirm: { en: Sure?, ja: 実行しますか？ }
- heading: { ja: 見出し, en: Heading }
- md: { ja: docs/a.md, en: docs/a.en.md }
- html: { ja: <b>注意</b>, en: <b>Note</b> }
- group: { ja: 資料, en: Documents }
  items: [{ open: docs }]
- select: target
  label: { ja: 接続先, en: Target }
  options:
    - { label: { ja: 本番, en: Production }, value: prod }
`

  it('表示中の言語の値で読む（無い言語は表の最初）', async () => {
    setLang('en')
    const { items, diagnostics } = await loadItems(yaml)
    expect(diagnostics).toEqual([])
    expect(items).toEqual([
      expect.objectContaining({
        kind: 'exec',
        label: 'Build',
        tooltip: '説明',
        confirm: 'Sure?'
      }),
      expect.objectContaining({ kind: 'heading', text: 'Heading' }),
      expect.objectContaining({ kind: 'mdfile', path: 'docs/a.en.md' }),
      expect.objectContaining({ kind: 'html', content: '<b>Note</b>' }),
      expect.objectContaining({ kind: 'group', title: 'Documents' }),
      expect.objectContaining({
        kind: 'select',
        label: 'Target',
        options: [{ label: 'Production', value: 'prod' }]
      })
    ])
  })

  it('英語しか書いていない表は、日本語でもエラーにせず英語で出す', async () => {
    const { items, diagnostics } = await loadItems("- bat: build.bat\n  label: { en: 'button' }")
    expect(diagnostics).toEqual([])
    expect(items[0]).toMatchObject({ kind: 'exec', label: 'button' })
  })

  it('日本語なら ja の値で読む', async () => {
    const { items } = await loadItems(yaml)
    expect(items[0]).toMatchObject({ label: 'ビルド', confirm: '実行しますか？' })
    expect(items[2]).toMatchObject({ kind: 'mdfile', path: 'docs/a.md' })
  })

  it('案件とページの title も表で書ける', async () => {
    setLang('en')
    const r = await loadFiles({
      [CONFIG_FILE]: `version: 1
title: { ja: 案件, en: Project }
pages:
  - id: top
    title: { ja: メイン, en: Main }
`
    })
    expect(r.project?.title).toBe('Project')
    expect(r.project?.pages[0]?.title).toBe('Main')
  })

  it('表の値が文字列でなければ、その項目のエラーにする', async () => {
    const { items } = await loadItems('- bat: build.bat\n  label: { ja: 1 }')
    expect(errorMessage(items[0])).toContain('label は文字列か { ja: …, en: … } で書いてください')
  })

  it('ローカル設定で置き換えた項目も、表示中の言語で読む', async () => {
    setLang('en')
    const { items } = await loadItems('- { id: b, bat: build.bat, label: ビルド }', {
      'launcher/config.local.yaml': `pages:
  - id: top
    items:
      - { id: b, bat: build.bat, label: { ja: ビルド, en: Build } }
`
    })
    expect(items).toEqual([expect.objectContaining({ id: 'b', label: 'Build' })])
  })
})
