import { en } from './en'
import { ja } from './ja'
import type { Messages } from './ja'

// 表示の言語と辞書。メインと画面はプロセスが別なので、それぞれで setLang する（既定は ja）。
// 決め方は docs/phase25-i18n-switch/PLAN.md

export type { Messages }
export const LANGS = ['ja', 'en'] as const
export type Lang = (typeof LANGS)[number]

const DICTS: Record<Lang, Messages> = { ja, en }
let current: Lang = 'ja'

/** いまの言語の辞書 */
export const t = (): Messages => DICTS[current]
export const getLang = (): Lang => current
export function setLang(lang: Lang): void {
  current = lang
}

export const isLang = (v: unknown): v is Lang => LANGS.includes(v as Lang)

/** OS の言語（ja-JP・en-US など）から表示の言語を決める。日本語でなければ英語 */
export const langFromLocale = (locale: string): Lang =>
  locale.toLowerCase().startsWith('ja') ? 'ja' : 'en'
