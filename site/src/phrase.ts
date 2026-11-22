import { loadDefaultJapaneseParser } from 'budoux'
import type { Lang } from '../../src/core/i18n'

// 日本語の短い文を、文節の切れ目でだけ折り返す HTML にする（ビルド時に行う）。
// 当てる場所と CSS は docs/writing.md「画面での改行」

const parser = loadDefaultJapaneseParser()

const escape = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/**
 * 文ごとに .s-sentence で包み、文節の境目に <wbr> を入れる。
 * 英語はそのまま（単語の間で折り返せる）
 */
export function phrase(text: string, lang: Lang): string {
  if (lang !== 'ja') return escape(text)
  const sentences = text.match(/[^。！？]+[。！？]?/g) ?? [text]
  return sentences
    .map((s) => `<span class="s-sentence">${parser.parse(s).map(escape).join('<wbr>')}</span>`)
    .join('')
}
