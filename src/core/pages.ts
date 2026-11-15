// タブに並べるページと、開いているページを決める。画面から使うため、node: モジュールに依存させない
import type { Page, Project } from './types'

export const HELP_ID = 'help'
export const INFO_ID = 'info'
const TOP_ID = 'top'

export interface PageLayout {
  /** タブに並べる案件のページ（info・help は除く。この後ろに Info・ヘルプのタブを置く） */
  pages: Page[]
  /** 設定に書いた help・info のページ（組み込みのページに足す） */
  userHelp?: Page
  userInfo?: Page
  helpOpen: boolean
  infoOpen: boolean
  /**
   * 項目を出すページ。ヘルプ・Info を開いていれば、設定に書いた help・info のページ。
   * それ以外は選んだページ、無ければ top、それも無ければ最初のページ
   */
  current?: Page
}

/**
 * info・help は組み込みのページで、最後に info・help の順に並べる。
 * 設定に help があれば、その項目をヘルプの最初の章にする。info なら Info の後ろに足す
 */
export function pageLayout(project: Project, pageId: string | undefined): PageLayout {
  const pages = project.pages.filter((p) => p.id !== HELP_ID && p.id !== INFO_ID)
  const userHelp = project.pages.find((p) => p.id === HELP_ID)
  const userInfo = project.pages.find((p) => p.id === INFO_ID)
  const helpOpen = pageId === HELP_ID
  const infoOpen = pageId === INFO_ID
  const current = helpOpen
    ? userHelp
    : infoOpen
      ? userInfo
      : (pages.find((p) => p.id === pageId) ?? pages.find((p) => p.id === TOP_ID) ?? pages[0])
  return { pages, userHelp, userInfo, helpOpen, infoOpen, current }
}
