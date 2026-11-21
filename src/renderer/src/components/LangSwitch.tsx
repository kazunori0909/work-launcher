import { getLang, LANGS, t } from '../../../core/i18n'

/**
 * 右上の言語の切り替え。いまの言語を出し、押すたびに次の言語に変える。
 * 選んだ言語はメインが記憶し、すべてのウィンドウを読み直す
 */
export function LangSwitch(): React.JSX.Element {
  const lang = getLang()
  const next = LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length]
  return (
    <button
      className="lang-switch"
      title={`${t().ui.langSwitch}: ${lang} → ${next}`}
      aria-label={`${t().ui.langSwitch}: ${lang}`}
      onClick={() => window.launcher.setLang(next)}
    >
      {/* 全部の言語を重ねて置き、いまの言語だけ見せる（幅がいちばん広いラベルに揃う） */}
      {LANGS.map((l) => (
        <span key={l} aria-hidden className={l === lang ? undefined : 'lang-hidden'}>
          {l}
        </span>
      ))}
    </button>
  )
}
