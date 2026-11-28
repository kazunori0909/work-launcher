import { existsSync } from 'node:fs'
import path from 'node:path'
import { app, BrowserWindow, dialog, Menu, session } from 'electron'
import type { MenuItemConstructorOptions, WebContents } from 'electron'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { PROJECT_FILE } from '../core/load'
import { currentSelections } from '../core/items'
import { chooseOpenTarget } from '../core/openTarget'
import { asString } from '../core/ipcArgs'
import type { ProjectView } from '../core/types'
import { callEvent, prepareClose } from './events'
import { handle, send } from './ipc'
import { handleFileScheme } from './links'
import { loadProjectView } from './project'
import { addRecent, listRecent, refreshJumpList } from './recent'
import { saveLang } from './lang'
import { NO_DISABLED } from '../core/itemState'
import { readRemembered } from './remembered'
import { readTheme, saveTheme } from './theme'
import { isTheme } from '../core/theme'
import { WindowSession } from './session'
import { getLang, isLang, t } from '../core/i18n'
import type { Lang } from '../core/i18n'

const windows = new Map<number, WindowSession>()
let nextPartition = 1

/** IPC を送ってきたウィンドウのセッション */
export function sessionOf(sender: WebContents): WindowSession | undefined {
  return windows.get(sender.id)
}

/** IPC を送ってきたウィンドウの案件 */
export function viewOf(sender: WebContents): ProjectView | undefined {
  return sessionOf(sender)?.view
}

/**
 * 案件を開く。同じ案件のウィンドウがあれば前に出し、開始画面のウィンドウがあればそこで開く。
 * どちらも無ければ新しいウィンドウを開く。launcherDir が無ければ開始画面を開く（あれば前に出す）
 */
export function openProject(launcherDir?: string, from?: WebContents): void {
  const list = [...windows.entries()].map(([id, w]) => ({ id, launcherDir: w.launcherDir }))
  const target = chooseOpenTarget(list, launcherDir, from?.id, process.platform)
  const w = target.type === 'create' ? undefined : windows.get(target.id)
  if (!w) return createWindow(launcherDir)
  if (target.type === 'load' && launcherDir) {
    setProject(w, launcherDir)
    void reload(w)
  }
  focus(w.window)
}

/** 「案件を開く…」のダイアログ。選んだ案件は、呼んだウィンドウが開始画面ならそこで開く */
export async function openProjectDialog(from?: BrowserWindow): Promise<void> {
  const options: Electron.OpenDialogOptions = {
    title: t().menu.openDialogTitle,
    properties: ['openFile'],
    filters: [{ name: 'WorkLauncher', extensions: ['launcher'] }]
  }
  const result = from
    ? await dialog.showOpenDialog(from, options)
    : await dialog.showOpenDialog(options)
  const file = result.filePaths[0]
  if (!result.canceled && file) openProject(path.dirname(file), from?.webContents)
}

function focus(window: BrowserWindow): void {
  if (window.isMinimized()) window.restore()
  window.focus()
}

function setProject(w: WindowSession, launcherDir: string): void {
  w.launcherDir = launcherDir
  addRecent(launcherDir)
  if (process.platform === 'darwin')
    w.window.setRepresentedFilename(path.join(launcherDir, PROJECT_FILE))
}

/**
 * 案件を読む。初めて読めたときは beforeOpen を呼び、終わってから返す（画面はそれまで出さない）。
 * afterOpen は返したあと（画面に渡したあと）に呼ぶ。設定の読み直しでは呼ばない
 */
async function load(w: WindowSession): Promise<ProjectView> {
  const loaded = await loadProjectView(w.launcherDir)
  w.watcher.set(loaded.files)
  const remembered = readRemembered(loaded.view.launcherDir)
  const view = (w.view = {
    ...loaded.view,
    appVersion: app.getVersion(),
    remembered,
    lang: getLang(),
    theme: readTheme(loaded.view.launcherDir)
  })
  const { project, launcherDir } = view
  if (!project || !launcherDir) return view
  // 画面で選んだ値は残し、選択肢から消えた値は記憶した値・既定値に戻す（画面の currentSelections と同じ）
  w.select = currentSelections(project, remembered, w.select)
  if (w.openedDir !== launcherDir) {
    w.openedDir = launcherDir
    w.disabled = NO_DISABLED
    await callEvent('beforeOpen', w)
    setTimeout(() => void callEvent('afterOpen', w))
  }
  // beforeOpen で JS が変えた分も、最初の画面に出す
  view.state = w.itemState
  return view
}

/** 読み直して画面に知らせる */
async function reload(w: WindowSession): Promise<void> {
  const view = await load(w)
  if (!w.window.isDestroyed()) send(w.window.webContents, 'project:changed', view)
}

function createWindow(launcherDir: string | undefined): void {
  // md・html の画像のプロトコルは要求元のウィンドウが分からないため、ウィンドウごとにセッションを分けて登録する
  const ses = session.fromPartition(`window-${nextPartition++}`)
  // カメラ・通知などの権限は使わないので断る。コピーのボタン（navigator.clipboard.writeText）だけ許す
  ses.setPermissionRequestHandler((_, permission, callback) =>
    callback(permission === 'clipboard-sanitized-write')
  )
  const window = new BrowserWindow({
    width: 960,
    height: 720,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      // プリロードは contextBridge と ipcRenderer だけを使う（→ docs/archive/phase11-refactor-architecture/PLAN.md の F）
      sandbox: true,
      session: ses
    }
  })
  const id = window.webContents.id
  const w: WindowSession = new WindowSession(window, () => void reload(w))
  windows.set(id, w)
  if (launcherDir) setProject(w, launcherDir)
  handleFileScheme(ses, () => w.view)

  // 閉じる前に beforeClose を待つ。終わったら閉じ直す（2回目は待たない）
  window.on('close', (event) => {
    if (w.closeReady) return
    if (!w.openedDir) {
      w.closeReady = true
      return
    }
    event.preventDefault()
    void prepareClose(w).then(() => {
      if (!window.isDestroyed()) window.close()
    })
  })
  window.on('closed', () => {
    w.close()
    windows.delete(id)
  })
  window.on('ready-to-show', () => window.show())

  // 新しいウィンドウは開かない。リンクは画面側で link:open に回し、openSchemes で確かめてから開く
  // （ここに来る URL は、相対リンクが案件フォルダではなくアプリの中を起点に解決されている）
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  // 埋め込みの html・md のリンクで画面が移らないようにする（リンクは画面側で link:open に回す）
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== window.webContents.getURL()) event.preventDefault()
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    window.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    window.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

export function registerWindowHandlers(): void {
  handle('loadProject', (e) => {
    const w = windows.get(e.sender.id)
    return w ? load(w) : undefined
  })
  handle('openProjectDialog', (e) =>
    openProjectDialog(BrowserWindow.fromWebContents(e.sender) ?? undefined)
  )
  handle('openProject', (e, arg) => {
    const dir = asString(arg)
    if (dir === undefined || !existsSync(path.join(dir, PROJECT_FILE)))
      return { error: t().open.noProjectFile(PROJECT_FILE, String(arg)) }
    openProject(dir, e.sender)
    return {}
  })
  handle('listRecent', () => listRecent())
  handle('setLang', (_, arg) => {
    if (isLang(arg)) changeLang(arg)
  })
  handle('setTheme', (e, arg) => {
    const dir = windows.get(e.sender.id)?.view?.launcherDir
    if (dir && isTheme(arg)) saveTheme(dir, arg)
  })
  // 「待たずに閉じる」: 待っている beforeClose の子プロセスを止める（止まれば prepareClose が終わり、閉じる）
  handle('closeNow', (e) => {
    windows.get(e.sender.id)?.stopAll()
  })
}

/** 表示の言語を変えて記憶し、メニューと開いているすべてのウィンドウを作り直す */
function changeLang(lang: Lang): void {
  if (lang === getLang()) return
  saveLang(lang)
  setAppMenu()
  refreshJumpList()
  for (const w of windows.values()) void reload(w)
}

/** アプリを終了する前に、案件を開いているすべてのウィンドウで beforeClose を待つ */
export function prepareQuit(): Promise<void> | undefined {
  const pending = [...windows.values()].filter((w) => w.openedDir && !w.closeReady)
  return pending.length > 0 ? Promise.all(pending.map(prepareClose)).then(() => {}) : undefined
}

export function setAppMenu(): void {
  const isMac = process.platform === 'darwin'
  const file: MenuItemConstructorOptions = {
    label: t().menu.file,
    submenu: [
      {
        label: t().menu.newWindow,
        accelerator: 'CmdOrCtrl+N',
        click: () => openProject()
      },
      {
        label: t().menu.openProject,
        accelerator: 'CmdOrCtrl+O',
        click: (_, window) => void openProjectDialog(window as BrowserWindow | undefined)
      },
      ...(isMac
        ? ([
            {
              label: t().menu.recent,
              role: 'recentDocuments',
              submenu: [{ label: t().menu.clearRecent, role: 'clearRecentDocuments' }]
            }
          ] satisfies MenuItemConstructorOptions[])
        : []),
      { type: 'separator' },
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  }
  const template: MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' } as const] : []),
    file,
    { role: 'editMenu' },
    ...(is.dev ? [{ role: 'viewMenu' } as const] : []),
    { role: 'windowMenu' }
  ]
  Menu.setApplicationMenu(Menu.buildFromTemplate(template))

  // Dock のアイコンの右クリックメニュー（最近開いた案件は OS が自動で並べる）
  app.dock?.setMenu(
    Menu.buildFromTemplate([
      { label: t().menu.newWindow, click: () => openProject() },
      { label: t().menu.openProject, click: () => void openProjectDialog() }
    ])
  )
}
