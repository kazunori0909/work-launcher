import { createContext } from 'react'
import { DEFAULT_OPEN_SCHEMES } from '../../../core/schemes'
import type { MarkdownFile } from '../../../core/types'

export interface EmbedContextValue {
  /** mdfile に書いたパスごとの中身 */
  mdfiles: Record<string, MarkdownFile>
  /** md・html のリンクを押したとき。baseDir は相対パスの起点（launcherDir からの相対フォルダ） */
  onLink(href: string, baseDir: string): void
  /** リンクとして残すスキーム（config.yaml の openSchemes。省略時は既定） */
  openSchemes: readonly string[]
}

export const EmbedContext = createContext<EmbedContextValue>({
  mdfiles: {},
  onLink: () => {},
  openSchemes: DEFAULT_OPEN_SCHEMES
})
