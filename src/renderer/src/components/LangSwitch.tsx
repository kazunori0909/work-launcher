import { getLang, LANG_NAMES, LANGS, t } from '../../../core/i18n'
import { MenuSwitch } from './MenuSwitch'

const OPTIONS = LANGS.map((l) => ({ value: l, label: LANG_NAMES[l], lang: l }))

/**
 * 右上の言語の切り替え。いまの言語を出し、押すと一覧から選ぶ。
 * 選んだ言語はメインが記憶し（アプリ全体で1つ）、すべてのウィンドウを読み直す
 */
export function LangSwitch(): React.JSX.Element {
  const lang = getLang()
  return (
    <MenuSwitch
      icon="globe"
      label={
        // 全部の言語名を重ねて置き、いまの言語だけ見せる（幅がいちばん広い名前に揃い、切り替えてもずれない）
        <span className="menu-switch-stack">
          {LANGS.map((l) => (
            <span key={l} aria-hidden className={l === lang ? undefined : 'menu-switch-hidden'}>
              {LANG_NAMES[l]}
            </span>
          ))}
        </span>
      }
      title={`${t().ui.langSwitch}: ${LANG_NAMES[lang]}`}
      options={OPTIONS}
      value={lang}
      onChange={(l) => window.launcher.setLang(l)}
    />
  )
}
