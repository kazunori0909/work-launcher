// 埋め込み（markdown・mdfile・html）のリンク・画像の解決。
// 画面とメインの両方から使うため、node: モジュールに依存させない

/** 案件フォルダ内のファイルを画面に渡すプロトコル。パスは launcherDir からの相対 */
export const FILE_SCHEME = 'wl-file'
const ROOT = `${FILE_SCHEME}://project/`

/** ブラウザで開いてよいリンクのスキーム */
const EXTERNAL_PROTOCOLS = ['http:', 'https:', 'mailto:']

export type LinkTarget =
  | { type: 'external'; url: string }
  /** 案件フォルダ内のファイル（launcherDir からの相対、`/` 区切り） */
  | { type: 'file'; path: string }
  | { type: 'anchor' }
  | { type: 'invalid'; reason: string }

const SCHEME = /^[a-z][a-z\d+.-]+:/i

/** 相対パスの起点にする URL。baseDir は launcherDir からの相対フォルダ（空なら launcherDir） */
function baseUrl(baseDir: string): string {
  const dir = baseDir.split('/').filter(Boolean).map(encodeURIComponent).join('/')
  return dir ? `${ROOT}${dir}/` : ROOT
}

/**
 * md・html のリンクの行き先。相対パスは baseDir 起点、`/` 始まりは launcherDir 起点。
 * 案件フォルダより上を指す `..` は launcherDir で止まる
 */
export function resolveLink(href: string, baseDir: string): LinkTarget {
  if (href.startsWith('#')) return { type: 'anchor' }
  if (SCHEME.test(href)) {
    let url: URL
    try {
      url = new URL(href)
    } catch {
      return { type: 'invalid', reason: `リンクが正しくありません: ${href}` }
    }
    if (EXTERNAL_PROTOCOLS.includes(url.protocol)) return { type: 'external', url: url.toString() }
    return { type: 'invalid', reason: `開けないリンクです: ${href}` }
  }
  const path = projectPath(href, baseDir)
  return path ? { type: 'file', path } : { type: 'anchor' }
}

/** 相対パスを launcherDir からの相対パスにする。空（フォルダそのもの）なら undefined */
function projectPath(href: string, baseDir: string): string | undefined {
  const url = new URL(href.replaceAll('\\', '/'), baseUrl(baseDir))
  let path: string
  try {
    path = decodeURIComponent(url.pathname)
  } catch {
    path = url.pathname
  }
  return path.replace(/^\/+/, '') || undefined
}

/** 画像などの src を画面で読める URL にする。外部・data: はそのまま */
export function resolveAsset(src: string, baseDir: string): string {
  if (SCHEME.test(src)) return src
  const path = projectPath(src, baseDir)
  return path ? fileUrl(path) : src
}

export function fileUrl(path: string): string {
  return ROOT + path.split('/').map(encodeURIComponent).join('/')
}

/** fileUrl の逆。プロトコルの外なら undefined */
export function pathFromFileUrl(url: string): string | undefined {
  if (!url.startsWith(ROOT)) return undefined
  return projectPath(url.slice(ROOT.length).split(/[?#]/)[0], '')
}

/** ファイルのあるフォルダ（`/` 区切りの相対パス） */
export function dirOf(path: string): string {
  const i = path.lastIndexOf('/')
  return i < 0 ? '' : path.slice(0, i)
}
