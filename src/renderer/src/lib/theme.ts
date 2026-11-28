import type { Theme } from '../../../core/theme'

/** テーマを画面に当てる: <html> の data-theme（'system' なら外して OS に従う。色は base.css） */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
}
