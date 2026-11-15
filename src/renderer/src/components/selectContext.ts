import { createContext } from 'react'
import type { SelectItem } from '../../../core/items'

export interface SelectContextValue {
  /** select の値（ID → 値） */
  values: Record<string, string>
  /** 画面で値を変えた（item は操作した項目。同じ ID が複数あっても、その項目の change を呼ぶ） */
  onChange(item: SelectItem, value: string): void
}

/** 案件の画面は App が、ヘルプの見本は見本ごとに値を渡す */
export const SelectContext = createContext<SelectContextValue>({ values: {}, onChange: () => {} })
