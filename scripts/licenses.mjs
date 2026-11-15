// アプリに入るサードパーティのライブラリのライセンス文を集め、out/renderer/third-party-licenses.json に書く。
// 画面の JS に取り込んだライブラリは配布物に LICENSE が残らないため、ここで集めてアプリに入れる
import { existsSync, readdirSync, readFileSync } from 'fs'
import { dirname, join, resolve, sep } from 'path'

export const LICENSES_FILE = 'third-party-licenses.json'

const NODE_MODULES = `${sep}node_modules${sep}`
const LICENSE_FILE = /^(licen[cs]e|copying)(\.(md|txt|markdown))?$/i

/** モジュールの絶対パスから、node_modules 直下のパッケージのフォルダを返す */
function packageRoot(id) {
  const file = id.replace(/^\0/, '').split('?')[0]
  const at = file.lastIndexOf(NODE_MODULES)
  if (at < 0) return undefined
  const rest = file.slice(at + NODE_MODULES.length).split(sep)
  const depth = rest[0].startsWith('@') ? 2 : 1
  return file.slice(0, at + NODE_MODULES.length) + rest.slice(0, depth).join(sep)
}

function readPackage(dir) {
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  const file = readdirSync(dir).find((f) => LICENSE_FILE.test(f))
  return {
    name: pkg.name,
    version: pkg.version,
    license: typeof pkg.license === 'string' ? pkg.license : (pkg.license?.type ?? 'UNKNOWN'),
    text: file ? readFileSync(join(dir, file), 'utf8').trim() : ''
  }
}

/** Node と同じく、親のフォルダの node_modules を順に探す（exports で package.json を引けないものがあるため） */
function findPackage(fromDir, name) {
  for (let dir = fromDir; ; dir = dirname(dir)) {
    const candidate = join(dir, 'node_modules', name)
    if (existsSync(join(candidate, 'package.json'))) return candidate
    if (dirname(dir) === dir) return undefined
  }
}

/** package.json の dependencies を辿り、実行時に node_modules としてアプリに入るパッケージのフォルダを集める */
function runtimeDependencies(root) {
  const found = new Set()
  const visit = (fromDir, names) => {
    for (const name of names) {
      const dir = findPackage(fromDir, name)
      if (!dir) continue // optionalDependencies などで入っていないもの
      if (found.has(dir)) continue
      found.add(dir)
      const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
      visit(dir, Object.keys(pkg.dependencies ?? {}))
    }
  }
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  visit(root, Object.keys(pkg.dependencies ?? {}))
  return found
}

/**
 * main・preload・renderer のそれぞれに付ける。共有の集合に取り込んだパッケージを足し、
 * `write: true` を付けたビルド（最後に動く renderer）が一覧を書き出す
 */
export function thirdPartyLicenses(shared, { write = false } = {}) {
  return {
    name: 'third-party-licenses',
    generateBundle() {
      for (const id of this.getModuleIds()) {
        const dir = packageRoot(id)
        if (dir && existsSync(join(dir, 'package.json'))) shared.add(dir)
      }
      if (!write) return
      for (const dir of runtimeDependencies(resolve('.'))) shared.add(dir)
      const list = [...shared]
        .map(readPackage)
        .sort((a, b) => a.name.localeCompare(b.name) || a.version.localeCompare(b.version))
      this.emitFile({ type: 'asset', fileName: LICENSES_FILE, source: JSON.stringify(list) })
    }
  }
}
