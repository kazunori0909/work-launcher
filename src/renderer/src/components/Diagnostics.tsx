import type { Diagnostic } from '../../../core/types'
import { t } from '../../../core/i18n'

interface Props {
  diagnostics: Diagnostic[]
  open?: boolean
}

export function Diagnostics({ diagnostics, open }: Props): React.JSX.Element | null {
  if (diagnostics.length === 0) return null
  const errors = diagnostics.filter((d) => d.level === 'error').length
  const warnings = diagnostics.length - errors
  return (
    <details className="diagnostics" open={open}>
      <summary>{t().ui.diagnostics(errors, warnings)}</summary>
      <ul>
        {diagnostics.map((d, i) => (
          <li key={i} className={d.level}>
            <span className="where">
              {d.file}
              {d.line !== undefined && `:${d.line}`}
            </span>
            <span className="message">{d.message}</span>
          </li>
        ))}
      </ul>
    </details>
  )
}
