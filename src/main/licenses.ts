import { readFile } from 'fs/promises'
import path from 'path'
import { handle } from './ipc'
import type { ThirdPartyLicense } from '../core/types'

// 一覧はビルド時に scripts/licenses.mjs が作る。開発中（electron-vite dev）は無いことがある
const LICENSES_PATH = path.join(__dirname, '../renderer/third-party-licenses.json')

export function registerLicenseHandlers(): void {
  handle('listLicenses', async (): Promise<ThirdPartyLicense[]> => {
    try {
      return JSON.parse(await readFile(LICENSES_PATH, 'utf8'))
    } catch {
      return []
    }
  })
}
