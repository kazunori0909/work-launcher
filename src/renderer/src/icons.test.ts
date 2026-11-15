import { icons } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { findIcon, ICON_NAMES, iconName } from './icons'

describe('findIcon', () => {
  it('一覧に出す名前で、すべてのアイコンを引ける', () => {
    for (const key of Object.keys(icons) as (keyof typeof icons)[]) {
      expect(findIcon(iconName(key))).toBe(icons[key])
    }
    expect(new Set(ICON_NAMES).size).toBe(ICON_NAMES.length)
  })

  it('Lucide のサイトの名前でも引ける', () => {
    expect(findIcon('arrow-down-a-z')).toBe(icons.ArrowDownAZ)
    expect(findIcon('letter-s')).toBe(icons.LetterS)
    expect(findIcon('letters')).toBe(icons.Letters)
    expect(findIcon('no-such-icon')).toBeUndefined()
  })
})
