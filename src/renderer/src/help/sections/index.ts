import type { Lang } from '../../../../core/i18n'
import type { HelpGroup } from './book'
import { HELP_EN } from './en'
import { HELP_JA } from './ja'

/** 言語ごとの章の一覧。アプリのヘルプ（HelpPage）と Web サイト（site/）の両方が使う */
export const HELP_BOOKS: Record<Lang, readonly HelpGroup[]> = { ja: HELP_JA, en: HELP_EN }
