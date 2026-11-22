import { createContext, useContext } from 'react'

// ヘルプの章をどこで描いているか。章の本文はアプリのヘルプと Web サイト（site/）の両方で使う。
// 出し分けの部品（OnlyApp・OnlyWeb）は parts.tsx

export type HelpTarget = 'app' | 'web'

export const HelpTargetContext = createContext<HelpTarget>('app')

export const useHelpTarget = (): HelpTarget => useContext(HelpTargetContext)
