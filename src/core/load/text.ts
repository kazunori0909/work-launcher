import { getLang } from '../i18n'

// 画面に出す文字の読み方。文字列か、言語ごとの表（{ ja: …, en: … }）で書ける（→ docs/config.md）

/**
 * 文字列ならそのまま、言語の表なら表示中の言語の値（無ければ表の最初の値）を返す。
 * どちらでもない（表の値が文字列でない・空の表など）なら undefined
 */
export function pickText(v: unknown, lang = getLang()): string | undefined {
  if (typeof v === 'string') return v
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return undefined
  const table = v as Record<string, unknown>
  const values = Object.values(table)
  if (values.length === 0 || values.some((x) => typeof x !== 'string')) return undefined
  return (typeof table[lang] === 'string' ? table[lang] : values[0]) as string
}
