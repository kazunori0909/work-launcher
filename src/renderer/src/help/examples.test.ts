/// <reference types="node" />
import { describe, expect, it } from 'vitest'
import { loadItems } from '../../../core/load/testing'
import { ELEMENT_CHEATS, EXAMPLES, ITEM_CHEATS, LAYOUT_CHEATS } from './examples'
import type { Cheat, Example } from './examples'
import { ELEMENT_CHEATS_EN, EXAMPLES_EN, ITEM_CHEATS_EN, LAYOUT_CHEATS_EN } from './examples.en'

const LANGS: [string, Record<string, Example>, Cheat[]][] = [
  ['ja', EXAMPLES, [...ITEM_CHEATS, ...ELEMENT_CHEATS, ...LAYOUT_CHEATS]],
  ['en', EXAMPLES_EN, [...ITEM_CHEATS_EN, ...ELEMENT_CHEATS_EN, ...LAYOUT_CHEATS_EN]]
]

describe.each(LANGS)('ヘルプの書き方の例（%s）', (_, examples, cheats) => {
  const all = [
    ...Object.entries(examples),
    ...cheats.flatMap((c) =>
      [c, ...(c.more ?? [])].map((example, i) => [`早見表 ${c.name} ${i + 1}`, example] as const)
    )
  ]
  it.each(all)('%s: YAML を読み込むと見本の項目と一致する', async (_, example) => {
    const { items, diagnostics } = await loadItems(example.yaml)
    expect(diagnostics).toEqual([])
    expect(items).toEqual(example.items.map((item) => expect.objectContaining(item)))
  })
})

describe('英語の早見表', () => {
  it('日本語と同じ種類を同じ順に並べる', () => {
    const names = (list: Cheat[]): string[] => list.map((c) => c.name)
    expect(names(ITEM_CHEATS_EN)).toEqual(names(ITEM_CHEATS))
    expect(names(ELEMENT_CHEATS_EN)).toEqual(names(ELEMENT_CHEATS))
    expect(names(LAYOUT_CHEATS_EN)).toEqual(names(LAYOUT_CHEATS))
  })
})
