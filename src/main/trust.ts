import { dialog } from 'electron'
import type { BrowserWindow } from 'electron'
import { readJson, stringList, userDataFile, writeJson } from './jsonStore'

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
    buttons: ['信頼して実行', 'キャンセル'],
    defaultId: 1,
    cancelId: 1,
    message: 'この案件の JS（scripts）を実行しますか？',
    detail: `${launcherDir}\n\nscripts に並べた JS は PC 上で何でも実行できます。内容を信頼できる案件だけ許可してください。この案件では次から確認しません。`
  }
  const { response } = window
    ? await dialog.showMessageBox(window, options)
    : await dialog.showMessageBox(options)
  if (response !== 0) return false
  writeJson(file(), [...trusted, launcherDir])
  return true
}
