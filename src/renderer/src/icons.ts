import { icons } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type IconKey = keyof typeof icons

const ICON_KEYS = Object.keys(icons) as IconKey[]
const loose = (s: string): string => s.replaceAll('-', '').toLowerCase()
const byLooseName = new Map(ICON_KEYS.map((k) => [loose(k), k]))

/**
 * 設定に書く名前（file-text）で Lucide のアイコン（FileText）を引く。名前どおりで無ければ、
 * ハイフンと大文字小文字を無視して引く（arrow-down-a-z と arrow-down-az のどちらでも引ける）
 */
export function findIcon(name: string): LucideIcon | undefined {
  const key = name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('') as IconKey
  return icons[key] ?? icons[byLooseName.get(loose(name)) ?? key]
}

/** 一覧に出す名前（FileText → file-text） */
export function iconName(key: string): string {
  return key
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Za-z])(\d)/g, '$1-$2')
    .toLowerCase()
}

export const ICON_NAMES = ICON_KEYS.map(iconName)
