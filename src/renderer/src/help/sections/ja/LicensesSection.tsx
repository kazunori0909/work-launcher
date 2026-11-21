import { AppLicense, LicenseList } from '../../Licenses'

/** ヘルプの章「ライセンス」 */
export function LicensesSection(): React.JSX.Element {
  return (
    <>
      <p>WorkLauncher は MIT ライセンスで配布しています。</p>
      <AppLicense />

      <h3>使っているソフトウェア</h3>
      <p>
        WorkLauncher は Electron の上で動いていて、Electron には Chromium と Node.js
        が入っています。Electron と Chromium のライセンス文は、アプリに同梱した{' '}
        <code>LICENSE.electron.txt</code> と <code>LICENSES.chromium.html</code> にあります。
      </p>
      <p>ほかに使っているライブラリを並べました。名前を押すと、ライセンスの本文が開きます。</p>
      <LicenseList />
    </>
  )
}
