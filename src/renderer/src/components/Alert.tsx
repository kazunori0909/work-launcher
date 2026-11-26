import type { ReactNode } from 'react'
import { ALERT_ICONS } from '../../../core/alert'
import type { AlertKind } from '../../../core/alert'
import { t } from '../../../core/i18n'
import { Icon } from './Icon'

/** アラートの枠。見出し（アイコンと種類の名前）を先に出す。md の `> [!NOTE]` と note などの項目で使う */
export function Alert({
  kind,
  children
}: {
  kind: AlertKind
  children: ReactNode
}): React.JSX.Element {
  return (
    <div className={`wl-alert wl-alert-${kind}`}>
      <div className="wl-alert-title">
        <Icon name={ALERT_ICONS[kind]} />
        {t().alert[kind]}
      </div>
      {children}
    </div>
  )
}
