import { describe, expect, it } from 'vitest'
import { LANGS } from '../../../core/i18n'
import { HELP_EN } from './sections/en'
import { HELP_JA } from './sections/ja'
import type { HelpGroup } from './sections/book'

const BOOKS: Record<(typeof LANGS)[number], readonly HelpGroup[]> = { ja: HELP_JA, en: HELP_EN }
const ids = (book: readonly HelpGroup[]): string[][] => book.map((g) => g.sections.map((s) => s.id))

describe('ヘルプの章の一覧', () => {
  it.each(LANGS)('%s は日本語と同じ章を同じ並びで持つ', (lang) => {
    expect(ids(BOOKS[lang])).toEqual(ids(HELP_JA))
  })
})
