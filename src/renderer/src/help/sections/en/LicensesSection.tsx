import { AppLicense, LicenseList } from '../../Licenses'

/** ヘルプの章「ライセンス」（英語） */
export function LicensesSection(): React.JSX.Element {
  return (
    <>
      <p>WorkLauncher is distributed under the MIT License.</p>
      <AppLicense />

      <h3>Software used</h3>
      <p>
        WorkLauncher runs on Electron, which includes Chromium and Node.js. The license texts of
        Electron and Chromium are in <code>LICENSE.electron.txt</code> and{' '}
        <code>LICENSES.chromium.html</code>, bundled with the app.
      </p>
      <p>Other libraries used are listed below. Click a name to open its license text.</p>
      <LicenseList />
    </>
  )
}
