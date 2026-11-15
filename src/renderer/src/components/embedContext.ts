import { createContext } from 'react'
import type { MarkdownFile } from '../../../core/types'

export interface EmbedContextValue {
  /** mdfile に書いたパスごとの中身 */
  mdfiles: Record<string, MarkdownFile>
  /** md・html のリンクを押したとき。baseDir は相対パスの起点（launcherDir からの相対フォルダ） */
  onLink(href: string, baseDir: string): void
}

export const EmbedContext = createContext<EmbedContextValue>({ mdfiles: {}, onLink: () => {} })
