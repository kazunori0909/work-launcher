// ライト・ダークの選択。'system' は OS に従う。
// アプリは案件フォルダごとに、サイトはブラウザに記憶する（→ docs/archive/phase39-lang-theme-switch/PLAN.md）

export const THEMES = ['system', 'light', 'dark'] as const
export type Theme = (typeof THEMES)[number]

export const isTheme = (v: unknown): v is Theme => THEMES.includes(v as Theme)

/** 記憶したテーマの表（案件フォルダ → テーマ）。テーマでない値は捨てる */
export type ThemeStore = Record<string, Theme>

export function parseThemeStore(raw: unknown): ThemeStore | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
  return Object.fromEntries(Object.entries(raw).filter(([, v]) => isTheme(v) && v !== 'system'))
}

/** テーマを書いた表を返す。'system' は既定なので、記憶から消す */
export function withTheme(store: ThemeStore, dir: string, theme: Theme): ThemeStore {
  const rest = Object.fromEntries(Object.entries(store).filter(([key]) => key !== dir))
  return theme === 'system' ? rest : { ...rest, [dir]: theme }
}
