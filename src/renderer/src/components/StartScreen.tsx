import { useEffect, useState } from 'react'
import { Icon } from './Icon'

interface Props {
  appVersion?: string
}

const folderName = (dir: string): string => dir.split(/[\\/]/).filter(Boolean).pop() ?? dir

/** 開く案件が決まっていないときの画面 */
export function StartScreen({ appVersion }: Props): React.JSX.Element {
  const [recent, setRecent] = useState<string[]>([])
  const [error, setError] = useState<string>()

  useEffect(() => {
    window.launcher.listRecent().then(setRecent)
  }, [])

  const open = async (dir: string): Promise<void> => {
    const result = await window.launcher.openProject(dir)
    setError(result.error)
  }

  return (
    <div className="start-screen">
      <h1>
        WorkLauncher
        {appVersion && <span className="start-version">{appVersion}</span>}
      </h1>
      <p className="path">
        案件の <code>work.launcher</code>{' '}
        を開いてください。ダブルクリックやアプリのアイコンへのドロップでも開けます。
      </p>
      <button className="item" onClick={() => window.launcher.openProjectDialog()}>
        <Icon name="folder-open" />
        案件を開く…
      </button>
      {error && <p className="start-error">{error}</p>}
      {recent.length > 0 && (
        <>
          <h2>最近開いた案件</h2>
          <ul className="start-recent">
            {recent.map((dir) => (
              <li key={dir}>
                <button onClick={() => open(dir)} title={dir}>
                  <span className="start-recent-name">{folderName(dir)}</span>
                  <span className="path">{dir}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
