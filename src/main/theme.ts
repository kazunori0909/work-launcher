import { parseThemeStore, withTheme } from '../core/theme'
import type { Theme } from '../core/theme'
import { readJson, userDataFile, writeJson } from './jsonStore'

// 案件ごとに選んだテーマ。キーは select の remember と同じ案件フォルダ。案件のリポジトリには書かない

const file = (): string => userDataFile('themes.json')

/** 案件で選んだテーマ。選んでいなければ（案件を開いていないときも）OS に従う */
export function readTheme(launcherDir: string | undefined): Theme {
  return (launcherDir && readJson(file(), parseThemeStore, {})[launcherDir]) || 'system'
}

/** 案件のテーマを記憶する。書けなくても、開いている間はそのテーマで描く */
export function saveTheme(launcherDir: string, theme: Theme): void {
  try {
    writeJson(file(), withTheme(readJson(file(), parseThemeStore, {}), launcherDir, theme))
  } catch {
    // 記憶できなくても切り替えは効かせる
  }
}
