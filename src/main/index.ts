import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { isPortable, launcherDirFromArgs, launcherDirNextToApp } from './project'
import { refreshJumpList } from './recent'
import { registerActionHandlers } from './actions'
import { registerRunHandlers } from './runs'
import { registerSelectionHandlers } from './selections'
import { registerFileScheme, registerLinkHandlers } from './links'
import { registerInfoHandlers } from './info'
import { registerLicenseHandlers } from './licenses'
import { loadShellPath } from './shellPath'
import {
  openProject,
  prepareQuit,
  registerWindowHandlers,
  sessionOf,
  setAppMenu,
  viewOf
} from './windows'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { initLang } from './lang'

// Windows のインストール版は1つのプロセスにまとめ、2つめの起動は案件を渡して終える。
// ポータブル版・開発中はまとめない（→ docs/archive/phase8-release-build/PLAN.md）
interface SecondLaunch {
  args: string[]
  cwd: string
}
if (process.platform === 'win32' && !is.dev && !isPortable(process.env)) {
  const launch: SecondLaunch = { args: process.argv.slice(1), cwd: process.cwd() }
  if (!app.requestSingleInstanceLock(launch)) {
    app.quit()
    process.exit(0)
  }
  app.on('second-instance', (_event, _argv, _cwd, data) => {
    const { args, cwd } = data as SecondLaunch
    app.whenReady().then(() => openProject(launcherDirFromArgs(args, cwd)))
  })
}

registerFileScheme()
loadShellPath()

// Mac の Dock へのドロップ・関連付けのダブルクリックは、起動引数ではなく open-file で届く。
// 起動前に届いた分は、起動したときに開く
const filesBeforeReady: string[] = []
app.on('open-file', (event, file) => {
  event.preventDefault()
  if (!app.isReady()) filesBeforeReady.push(file)
  else openProject(launcherDirFromArgs([file]))
})

app.whenReady().then(() => {
  electronApp.setAppUserModelId('io.github.kazunori0909.worklauncher')

  // 開発中は F12 で DevTools、配布版は CommandOrControl + R を無効にする
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  initLang()
  setAppMenu()
  refreshJumpList()
  registerWindowHandlers()
  registerRunHandlers(sessionOf)
  registerActionHandlers(sessionOf)
  registerLinkHandlers(viewOf)
  registerInfoHandlers(viewOf)
  registerSelectionHandlers(sessionOf)
  registerLicenseHandlers()

  // 案件を指定しなければ、開発中は同梱のサンプル、配布版はアプリと同じフォルダの案件を開く。
  // どれも無ければ開始画面
  if (filesBeforeReady.length > 0) {
    for (const file of filesBeforeReady) openProject(launcherDirFromArgs([file]))
  } else {
    openProject(
      launcherDirFromArgs(process.argv.slice(1)) ??
        process.env['LAUNCHER_PROJECT'] ??
        (is.dev
          ? join(app.getAppPath(), 'examples/sample')
          : launcherDirNextToApp(process.execPath, process.env))
    )
  }

  // Mac は Dock のアイコンを押したときにウィンドウが無ければ開始画面を開く
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) openProject()
  })
})

// 終了する前に、各ウィンドウの beforeClose を待つ。待ち終えたら終了し直す（2回目は待たない）
let quitReady = false
app.on('before-quit', (event) => {
  if (quitReady) return
  const waiting = prepareQuit()
  if (!waiting) return
  event.preventDefault()
  void waiting.then(() => {
    quitReady = true
    app.quit()
  })
})

// Mac はウィンドウをすべて閉じてもアプリを終えない（⌘Q で終える）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
