import path from 'node:path'

export const MAX_RECENT = 10

/** 同じフォルダか。Windows・Mac の既定のファイルシステムは大文字と小文字を区別しない */
export function samePath(a: string, b: string, platform: NodeJS.Platform): boolean {
  const norm = (p: string): string => {
    const abs = path.resolve(p).replace(/[\\/]+$/, '')
    return platform === 'linux' ? abs : abs.toLowerCase()
  }
  return norm(a) === norm(b)
}

/** 最近開いた案件の先頭に足す（同じフォルダは前の位置から除き、最大 MAX_RECENT 件） */
export function pushRecent(list: string[], dir: string, platform: NodeJS.Platform): string[] {
  return [dir, ...list.filter((d) => !samePath(d, dir, platform))].slice(0, MAX_RECENT)
}

/** ジャンプリストの1項目（Electron の JumpListItem の task と同じ形） */
export interface JumpTask {
  type: 'task'
  title: string
  description: string
  program: string
  args: string
  iconPath: string
  iconIndex: number
}

/** 最近開いた案件を、Windows のジャンプリストの項目にする。表示はフォルダ名、説明はフルパス */
export function recentJumpTasks(dirs: string[], exe: string, projectFile: string): JumpTask[] {
  return dirs.map((dir) => ({
    type: 'task',
    title: path.win32.basename(dir) || dir,
    description: dir,
    program: exe,
    args: `"${path.win32.join(dir, projectFile)}"`,
    iconPath: exe,
    iconIndex: 0
  }))
}
