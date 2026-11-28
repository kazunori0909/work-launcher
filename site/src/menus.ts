import { isTheme } from '../../src/core/theme'
import type { Theme } from '../../src/core/theme'

// ヘッダーの言語・テーマの一覧（<details>）。外を押す・Esc で閉じ、テーマはブラウザに記憶する。
// 描く前に当てるのは Base.astro の <head> のスクリプト

const KEY = 'theme'

function currentTheme(): Theme {
  const t = document.documentElement.dataset.theme
  return isTheme(t) ? t : 'system'
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement
  if (theme === 'system') delete root.dataset.theme
  else root.dataset.theme = theme
  try {
    if (theme === 'system') localStorage.removeItem(KEY)
    else localStorage.setItem(KEY, theme)
  } catch {
    // 記憶できなくても、このページでは切り替える
  }
  markTheme()
}

/** 一覧のいまのテーマに印を付ける */
function markTheme(): void {
  const theme = currentTheme()
  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-theme-choice]'))
    b.setAttribute('aria-current', String(b.dataset.themeChoice === theme))
}

export function initMenus(): void {
  const menus = [...document.querySelectorAll<HTMLDetailsElement>('.s-menu')]
  const closeAll = (except?: Element): void => {
    for (const d of menus) if (d !== except) d.open = false
  }
  document.addEventListener('pointerdown', (e) => {
    closeAll((e.target as Element).closest('.s-menu') ?? undefined)
  })
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll()
  })
  // 一つを開いたら、ほかは閉じる
  for (const d of menus) d.addEventListener('toggle', () => d.open && closeAll(d))

  for (const b of document.querySelectorAll<HTMLButtonElement>('[data-theme-choice]')) {
    b.addEventListener('click', () => {
      if (isTheme(b.dataset.themeChoice)) applyTheme(b.dataset.themeChoice)
      closeAll()
    })
  }
  markTheme()
}
