import { useEffect, useState } from 'react'
import { Icon } from './Icon'
import { t } from '../../../core/i18n'
import { LangSwitch } from './LangSwitch'

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
      <LangSwitch />
      <h1>
        WorkLauncher
        {appVersion && <span className="start-version">{appVersion}</span>}
      </h1>
      <p className="path">
        {t().ui.startLead1} <code>work.launcher</code> {t().ui.startLead2}
      </p>
      <button className="item" onClick={() => window.launcher.openProjectDialog()}>
        <Icon name="folder-open" />
        {t().ui.openProject}
      </button>
      {error && <p className="start-error">{error}</p>}
      {recent.length > 0 && (
        <>
          <h2>{t().ui.recent}</h2>
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
