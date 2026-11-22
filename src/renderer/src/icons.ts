import { icons } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { iconName, lookupIcon } from './iconNames'

// アイコンを名前で引く。Web サイトのビルドでは、このファイルを site/src/icons.ts に差し替える

export { iconName }

/** 設定に書く名前（file-text）で Lucide のアイコン（FileText）を引く */
export const findIcon = (name: string): LucideIcon | undefined => lookupIcon(icons, name)

export const ICON_NAMES = Object.keys(icons).map(iconName)

/** アイコン一覧に出す名前。アプリではすぐ返す（Web サイトでは読み込んでから返す） */
export const useIconNames = (): readonly string[] => ICON_NAMES
