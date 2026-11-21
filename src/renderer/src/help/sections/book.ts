import type { SectionProps } from '../parts'

// 章の一覧の形。言語ごとに sections/<言語>/index.ts で1つずつ作り、ID と並びは全言語で揃える
// （揃っているかは help.test.ts で確かめる）

export interface HelpSection {
  id: string
  title: string
  /** 章の本文（枠と見出しは HelpPage が付ける） */
  Body: (props: SectionProps) => React.JSX.Element
}

/** サイドメニューの分類。label が無い分類は見出しを出さない */
export interface HelpGroup {
  label?: string
  sections: readonly HelpSection[]
}
