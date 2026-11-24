import { createContext } from 'react'
import { NO_DISABLED } from '../../../core/itemState'
import type { DisabledItems } from '../../../core/types'

/** 押せない項目。案件の画面は App が渡す（ヘルプの見本・サイトでは何も押せなくしない） */
export const DisabledContext = createContext<DisabledItems>(NO_DISABLED)
