import { useEffect, useState } from 'react'
import { t } from '../../../core/i18n'
import type { ThirdPartyLicense } from '../../../core/types'
import appLicense from '../../../../LICENSE?raw'

// ライセンスの章の部品。章の文章は sections/<言語>/LicensesSection.tsx

/** WorkLauncher 自体のライセンス文 */
export function AppLicense(): React.JSX.Element {
  return <pre className="code license-text">{appLicense.trim()}</pre>
}

/** アプリに入っているライブラリのライセンス文（名前を押すと開く） */
export function LicenseList(): React.JSX.Element | null {
  const [list, setList] = useState<ThirdPartyLicense[]>()
  useEffect(() => {
    window.launcher.listLicenses().then(setList)
  }, [])

  if (list === undefined) return null
  if (list.length === 0) return <p className="muted">{t().help.licenseListBuiltOnly}</p>
  return (
    <>
      {list.map((p) => (
        <details key={`${p.name}@${p.version}`} className="license">
          <summary>
            {p.name} {p.version} <span className="muted">{t().paren(p.license).trim()}</span>
          </summary>
          <pre className="code license-text">{p.text || t().help.noLicenseText(p.license)}</pre>
        </details>
      ))}
    </>
  )
}
