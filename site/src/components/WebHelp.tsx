import type { ReactNode } from 'react'
import { setLang } from '../../../src/core/i18n'
import type { Lang } from '../../../src/core/i18n'
import { HelpTargetContext } from '../../../src/renderer/src/help/target'

/** ヘルプの部品を Web で描くときの枠。辞書の言語を合わせ、出し分けを web にする */
export function WebHelp({
  lang,
  children
}: {
  lang: Lang
  children: ReactNode
}): React.JSX.Element {
  // t() は1つの言語を持つので、描く前に合わせる（ビルドではページを順に描く）
  setLang(lang)
  return <HelpTargetContext.Provider value="web">{children}</HelpTargetContext.Provider>
}
