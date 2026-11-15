import { useEffect, useState } from 'react'
import type { ThirdPartyLicense } from '../../../core/types'
import appLicense from '../../../../LICENSE?raw'

/** WorkLauncher 自体のライセンスと、アプリに入っているライブラリのライセンス文 */
export function Licenses(): React.JSX.Element {
  const [list, setList] = useState<ThirdPartyLicense[]>()
  useEffect(() => {
    window.launcher.listLicenses().then(setList)
  }, [])

  return (
    <>
      <p>WorkLauncher は MIT ライセンスで配布しています。</p>
      <pre className="code license-text">{appLicense.trim()}</pre>

      <h3>使っているソフトウェア</h3>
      <p>
        WorkLauncher は Electron（Chromium・Node.js を含む）の上で動きます。Electron と Chromium
        のライセンス文は、アプリに同梱の <code>LICENSE.electron.txt</code>・
        <code>LICENSES.chromium.html</code>{' '}
        にあります。そのほかに次のライブラリを使っています（名前を押すと本文が出ます）。
      </p>
      {list === undefined ? null : list.length === 0 ? (
        <p className="muted">一覧はビルドしたアプリでだけ出ます。</p>
      ) : (
        list.map((p) => (
          <details key={`${p.name}@${p.version}`} className="license">
            <summary>
              {p.name} {p.version} <span className="muted">（{p.license}）</span>
            </summary>
            <pre className="code license-text">
              {p.text || `（ライセンス文なし: ${p.license}）`}
            </pre>
          </details>
        ))
      )}
    </>
  )
}
