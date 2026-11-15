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
        WorkLauncher は Electron の上で動いていて、Electron には Chromium と Node.js
        が入っています。Electron と Chromium のライセンス文は、アプリに同梱した{' '}
        <code>LICENSE.electron.txt</code> と <code>LICENSES.chromium.html</code> にあります。
      </p>
      <p>ほかに使っているライブラリを並べました。名前を押すと、ライセンスの本文が開きます。</p>
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
