import { THEMES } from '../../../core/theme'
import type { Theme } from '../../../core/theme'
import { t } from '../../../core/i18n'
import { MenuSwitch } from './MenuSwitch'

const ICONS: Record<Theme, string> = { system: 'monitor', light: 'sun', dark: 'moon' }

/** 右上のテーマの切り替え（アイコンだけ）。押すと「OS に従う / ライト / ダーク」から選ぶ */
export function ThemeSwitch({
  theme,
  onChange
}: {
  theme: Theme
  onChange: (theme: Theme) => void
}): React.JSX.Element {
  const names = t().ui.themes
  return (
    <MenuSwitch
      icon={ICONS[theme]}
      title={`${t().ui.theme}: ${names[theme]}`}
      options={THEMES.map((v) => ({ value: v, label: names[v], icon: ICONS[v] }))}
      value={theme}
      onChange={onChange}
    />
  )
}
