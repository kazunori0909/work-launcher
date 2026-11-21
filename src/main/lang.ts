import { app } from 'electron'
import { isLang, langFromLocale, setLang } from '../core/i18n'
import type { Lang } from '../core/i18n'
import { readJson, userDataFile, writeJson } from './jsonStore'

// 表示の言語。画面の右上で選んだ言語を記憶し、選んでいなければ OS の言語に従う
// （決め方は docs/phase25-i18n-switch/PLAN.md）

const file = (): string => userDataFile('settings.json')

interface Settings {
  lang?: Lang
}

const parse = (raw: unknown): Settings | undefined =>
  typeof raw === 'object' && raw !== null
    ? { lang: isLang((raw as Settings).lang) ? (raw as Settings).lang : undefined }
    : undefined

/** 起動したときに言語を決める（app の ready の後に呼ぶ。getLocale はそれまで空） */
export function initLang(): void {
  setLang(readJson(file(), parse, {}).lang ?? langFromLocale(app.getLocale()))
}

/** 選んだ言語にして記憶する。書けなくても、このまま使う */
export function saveLang(lang: Lang): void {
  setLang(lang)
  try {
    writeJson(file(), { ...readJson(file(), parse, {}), lang })
  } catch {
    // 記憶できなくても切り替えは効かせる
  }
}
