import { dialog } from 'electron'
import type { BrowserWindow } from 'electron'
import { readJson, stringList, userDataFile, writeJson } from './jsonStore'
import { t } from '../core/i18n'

const file = (): string => userDataFile('trusted-projects.json')

/** 信頼済みでなければ確認を出す。信頼されたら記録して true を返す */
export async function ensureTrusted(
  launcherDir: string,
  window: BrowserWindow | null
): Promise<boolean> {
  const trusted = readJson(file(), stringList, [])
  if (trusted.includes(launcherDir)) return true
  const options = {
    type: 'warning' as const,
    buttons: t().script.trustButtons,
    defaultId: 1,
    cancelId: 1,
    message: t().script.trustMessage,
    detail: `${launcherDir}\n\n${t().script.trustDetail}`
  }
  const { response } = window
    ? await dialog.showMessageBox(window, options)
    : await dialog.showMessageBox(options)
  if (response !== 0) return false
  writeJson(file(), [...trusted, launcherDir])
  return true
}
