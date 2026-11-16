/// <reference types="node" />
import { describe, expect, it } from 'vitest'
import { loadItems } from '../../../core/load/testing'
import { ELEMENT_CHEATS, EXAMPLES, ITEM_CHEATS, LAYOUT_CHEATS } from './examples'

describe('ヘルプの書き方の例', () => {
  const all = [
    ...Object.entries(EXAMPLES),
    ...[...ITEM_CHEATS, ...ELEMENT_CHEATS, ...LAYOUT_CHEATS].flatMap((c) =>
      [c, ...(c.more ?? [])].map((example, i) => [`早見表 ${c.name} ${i + 1}`, example] as const)
    )
  ]
  it.each(all)('%s: YAML を読み込むと見本の項目と一致する', async (_, example) => {
    const { items, diagnostics } = await loadItems(example.yaml)
    expect(diagnostics).toEqual([])
    expect(items).toEqual(example.items.map((item) => expect.objectContaining(item)))
  })
})
