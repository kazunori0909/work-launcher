import { useCallback, useMemo, useState } from 'react'
import { itemAt, itemLabel, pathKey, walkItems } from '../../core/items'
import { resolveLink } from '../../core/markdown'
import { DEFAULT_OPEN_SCHEMES } from '../../core/schemes'
import { HELP_ID, INFO_ID, pageLayout } from '../../core/pages'
import type { Diagnostic, Project } from '../../core/types'
import { Console } from './components/Console'
import { Diagnostics } from './components/Diagnostics'
import { EmbedContext } from './components/embedContext'
import type { EmbedContextValue } from './components/embedContext'
import { Icon } from './components/Icon'
import { InfoPage } from './components/InfoPage'
import { LangSwitch } from './components/LangSwitch'
import { PageView } from './components/PageView'
import { SelectContext } from './components/selectContext'
import { StartScreen } from './components/StartScreen'
import { Tooltip } from './components/Tooltip'
import { HelpPage } from './help/HelpPage'
import { useConsole } from './hooks/useConsole'
import { useClosing, useProjectView, useWindowTitle } from './hooks/useProjectView'
import { useSelections } from './hooks/useSelections'
import { findIcon } from './icons'
import { t } from '../../core/i18n'

/** Lucide に無いアイコン名を警告にする（アイコンセットは画面側にしか無いため、ここで調べる） */
function unknownIcons(project: Project): Diagnostic[] {
  const warn = (where: string, name: string): Diagnostic => ({
    level: 'warning',
    file: t().load.page(where),
    message: t().load.unknownIcon(name)
  })
  return project.pages.flatMap((page) => [
    ...(page.icon && !findIcon(page.icon) ? [warn(page.id, page.icon)] : []),
    ...walkItems(page.items).flatMap((item) =>
      'icon' in item && item.icon && !findIcon(item.icon) ? [warn(page.id, item.icon)] : []
    )
  ])
}

function App(): React.JSX.Element {
  const view = useProjectView()
  const title = useWindowTitle(view)
  const closing = useClosing()
  const [pageId, setPageId] = useState<string>()
  const [helpSection, setHelpSection] = useState<string>()
  const consoleState = useConsole(view?.consoleRules)
  const { entries, runs, reportError } = consoleState
  const selections = useSelections(view, reportError)

  const onLink = useCallback(
    async (href: string, baseDir: string) => {
      const target = resolveLink(href, baseDir)
      if (target.type === 'anchor') {
        const id = decodeURIComponent(href.slice(1))
        const el = document.getElementById(id) ?? document.getElementById(`user-content-${id}`)
        el?.scrollIntoView()
        return
      }
      const result = await window.launcher.openLink(href, baseDir)
      if (result.error) reportError(`■ ${result.error}`)
    },
    [reportError]
  )
  const mdfiles = view?.mdfiles
  const openSchemes = view?.project?.openSchemes ?? DEFAULT_OPEN_SCHEMES
  const embed = useMemo<EmbedContextValue>(
    () => ({ mdfiles: mdfiles ?? {}, onLink, openSchemes }),
    [mdfiles, onLink, openSchemes]
  )

  if (!view) return <div className="status">{t().ui.loading}</div>

  const { project, diagnostics, platform } = view
  if (!view.launcherDir) return <StartScreen appVersion={view.appVersion} />
  if (!project) {
    return (
      <div className="fatal">
        <h1>{t().ui.cannotLoad}</h1>
        <p className="path">{view.launcherDir}</p>
        <Diagnostics diagnostics={diagnostics} open />
        <button className="item" onClick={() => window.launcher.openProjectDialog()}>
          <Icon name="folder-open" />
          {t().ui.openOther}
        </button>
      </div>
    )
  }

  const { pages, userHelp, userInfo, helpOpen, infoOpen, current } = pageLayout(project, pageId)

  const activate = async (path: number[]): Promise<void> => {
    const item = current && itemAt(current.items, path)
    if (!current || !item) return
    const { values } = selections
    const result =
      item.kind === 'exec'
        ? await window.launcher.run(current.id, path, values)
        : await window.launcher.activate(current.id, path, values)
    if ('error' in result && result.error) {
      reportError(`■ ${itemLabel(item, platform)}: ${result.error}`)
    }
  }

  const running = new Set(
    runs.flatMap((r) => (r.path && r.pageId === current?.id ? [pathKey(r.path)] : []))
  )

  return (
    <div className="app">
      {view.css.map((css, i) => (
        <style key={i}>{css}</style>
      ))}
      <header className="header">
        <span className="header-title" title={view.launcherDir}>
          {title}
        </span>
        {view.appVersion && <span className="header-version">WorkLauncher {view.appVersion}</span>}
        <LangSwitch />
      </header>
      <nav className="tabs">
        {pages.map((p) => (
          <button
            key={p.id}
            className={p === current ? 'tab active' : 'tab'}
            onClick={() => setPageId(p.id)}
          >
            <Icon name={p.icon} />
            {p.title ?? p.id}
          </button>
        ))}
        <button className={infoOpen ? 'tab active' : 'tab'} onClick={() => setPageId(INFO_ID)}>
          <Icon name={userInfo?.icon ?? 'monitor'} />
          {userInfo?.title ?? 'Info'}
        </button>
        <button className={helpOpen ? 'tab active' : 'tab'} onClick={() => setPageId(HELP_ID)}>
          <Icon name="circle-question-mark" />
          {userHelp?.title ?? t().ui.help}
        </button>
        {!consoleState.open && entries.length > 0 && (
          <button className="console-toggle" onClick={() => consoleState.setOpen(true)}>
            {t().console.title}
            {runs.length > 0 && t().console.running(runs.length)}
          </button>
        )}
      </nav>
      <Diagnostics diagnostics={[...diagnostics, ...unknownIcons(project)]} />
      <EmbedContext.Provider value={embed}>
        <SelectContext.Provider value={selections}>
          <main className="page">
            {helpOpen ? (
              <HelpPage
                launcherDir={view.launcherDir}
                workDir={view.workDir}
                platform={platform}
                selected={helpSection}
                onSelect={setHelpSection}
                projectTitle={title}
                projectHelp={
                  current && (
                    <PageView
                      page={current}
                      platform={platform}
                      running={running}
                      onActivate={activate}
                    />
                  )
                }
                onError={(message) => reportError(`■ ${message}`)}
              />
            ) : (
              <>
                {infoOpen && <InfoPage key={view.lang} />}
                {current ? (
                  <PageView
                    page={current}
                    platform={platform}
                    running={running}
                    onActivate={activate}
                  />
                ) : (
                  !infoOpen && <p className="status">{t().ui.noPages}</p>
                )}
              </>
            )}
          </main>
        </SelectContext.Provider>
      </EmbedContext.Provider>
      <Tooltip />
      {closing && (
        <div className="closing" role="status">
          <span>{t().ui.closingWait}</span>
          <button className="item" onClick={() => window.launcher.closeNow()}>
            {t().ui.closeNow}
          </button>
        </div>
      )}
      {consoleState.open && (
        <Console
          entries={entries}
          running={runs}
          onStop={(runId) => window.launcher.stop(runId)}
          onClear={consoleState.clear}
          onClose={() => consoleState.setOpen(false)}
        />
      )}
    </div>
  )
}

export default App
