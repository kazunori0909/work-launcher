import { existsSync } from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import { is } from '@electron-toolkit/utils'
import { PROJECT_FILE } from '../core/load'
import { pushRecent, recentJumpTasks } from '../core/recent'
import { readJson, stringList, userDataFile, writeJson } from './jsonStore'
import { isPortable } from './project'

const recentFile = (): string => userDataFile('recent.json')

const read = (): string[] => readJson(recentFile(), stringList, [])

/** 最近開いた案件（新しい順）。work.launcher が無くなったフォルダは除く */
export function listRecent(): string[] {
  return read().filter((d) => existsSync(path.join(d, PROJECT_FILE)))
}

/**
 * OS 側の「最近」の出し方。Windows のインストール版は自前のジャンプリスト、Mac は OS の最近使った項目。
 * Windows の開発中・ポータブル版は exe が案件を開く形で起動できないため出さない（→ phase8 の PLAN.md）
 */
function osRecent(): 'jumpList' | 'document' | 'none' {
  if (process.platform !== 'win32') return 'document'
  return is.dev || isPortable(process.env) ? 'none' : 'jumpList'
}

/** Windows のジャンプリストを最近開いた案件で作り直す */
export function refreshJumpList(): void {
  if (osRecent() !== 'jumpList') return
  const items = recentJumpTasks(listRecent(), process.execPath, PROJECT_FILE)
  // 項目が無いときは既定に戻す（空のカテゴリは置けない）
  app.setJumpList(items.length > 0 ? [{ type: 'custom', name: '最近開いた案件', items }] : null)
}

/** 最近開いた案件に足し、OS 側の「最近」（Mac の Dock・Windows のジャンプリスト）にも出す */
export function addRecent(dir: string): void {
  try {
    writeJson(recentFile(), pushRecent(read(), dir, process.platform))
  } catch {
    // 履歴が書けなくても案件は開ける
  }
  const mode = osRecent()
  if (mode === 'document') app.addRecentDocument(path.join(dir, PROJECT_FILE))
  else if (mode === 'jumpList') refreshJumpList()
}
