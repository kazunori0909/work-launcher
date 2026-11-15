import { readdirSync, statSync } from 'node:fs'
import path from 'node:path'

/**
 * scripts に並べたパス（絶対パス）を JS ファイルの一覧にする。フォルダは中の .js を名前順にすべて
 * （サブフォルダは見ない）。無いパスがあればそれを返す
 */
export function listScriptFiles(paths: string[]): { files: string[] } | { missing: string } {
  const files: string[] = []
  for (const p of paths) {
    let stat
    try {
      stat = statSync(p)
    } catch {
      return { missing: p }
    }
    if (!stat.isDirectory()) {
      files.push(p)
      continue
    }
    const inDir = readdirSync(p, { withFileTypes: true })
      .filter((e) => e.isFile() && e.name.endsWith('.js'))
      .map((e) => path.join(p, e.name))
      .sort()
    files.push(...inDir)
  }
  return { files: [...new Set(files)] }
}
