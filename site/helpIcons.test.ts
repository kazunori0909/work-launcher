import { icons } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { defaultIcon } from '../src/core/items'
import type { Item } from '../src/core/types'
import * as ja from '../src/renderer/src/help/examples'
import * as en from '../src/renderer/src/help/examples.en'
import type { Cheat, Example } from '../src/renderer/src/help/examples'
import { lookupIcon } from '../src/renderer/src/iconNames'
import { helpIconKeys } from './helpIcons'

// サイトに入れるアイコン（ソースから拾ったもの）に、見本で描くアイコンが全部入っているか。
// 漏れると、ビルド時の HTML とブラウザの描画が食い違う

/** examples.ts・examples.en.ts の見本を全部（早見表の more も） */
function allExamples(): Example[] {
  const out: Example[] = []
  for (const mod of [ja, en]) {
    for (const v of Object.values(mod)) {
      if (Array.isArray(v)) for (const c of v as Cheat[]) out.push(c, ...(c.more ?? []))
      else if (v && typeof v === 'object') out.push(...(Object.values(v) as Example[]))
    }
  }
  return out.filter((e) => Array.isArray(e?.items))
}

function iconsOf(items: Item[]): string[] {
  return items.flatMap((item) => [
    ...('icon' in item && item.icon !== undefined ? [item.icon] : [defaultIcon(item) ?? '']),
    ...('items' in item ? iconsOf(item.items) : [])
  ])
}

describe('サイトに入れるアイコン', () => {
  it('ヘルプの見本で描くアイコンが全部入っている', () => {
    const keys = new Set(helpIconKeys())
    const used = new Set(
      allExamples()
        .flatMap((e) => iconsOf(e.items))
        .filter(Boolean)
    )
    expect(used.size).toBeGreaterThan(5)
    const missing = [...used].filter((name) => {
      const icon = lookupIcon(icons, name)
      return !Object.entries(icons).some(([k, v]) => v === icon && keys.has(k))
    })
    expect(missing).toEqual([])
  })
})
