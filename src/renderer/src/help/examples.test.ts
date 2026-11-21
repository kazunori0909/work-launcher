/// <reference types="node" />
import { describe, expect, it } from 'vitest'
import { BUILTIN_TOOLS } from '../../../core/load/info'
import { loadItems } from '../../../core/load/testing'
import { BUILTIN_TOOL_ROWS, ELEMENT_CHEATS, EXAMPLES, ITEM_CHEATS, LAYOUT_CHEATS } from './examples'

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

describe('ヘルプの組み込みツールの表', () => {
  it('core の組み込みツールと同じものを同じ並びで載せる', () => {
    expect(BUILTIN_TOOL_ROWS.map(([name]) => name)).toEqual(BUILTIN_TOOLS)
  })
})
