// 外部に開く URL のスキームの許可リスト（config.yaml の openSchemes。docs/config.md 2章）。
// リンク・url 項目・ctx.url のどれもここで確かめる

/** openSchemes を省略したときに開いてよいスキーム */
export const DEFAULT_OPEN_SCHEMES: readonly string[] = ['http', 'https', 'mailto']

/** 画面の中でスクリプトや埋め込みの中身になるため、openSchemes に書いても許さない */
export const FORBIDDEN_SCHEMES: readonly string[] = ['javascript', 'vbscript', 'data']

const NAME = /^[a-z][a-z\d+.-]*$/

/** `HTTP` や `file:` を `http`・`file` にする。スキームとして書けない文字なら undefined */
export function normalizeScheme(text: string): string | undefined {
  const name = text.trim().toLowerCase().replace(/:$/, '')
  return NAME.test(name) ? name : undefined
}

export type ExternalTarget =
  /** ブラウザなど OS の既定アプリに渡す */
  | { type: 'url'; url: string }
  /** file: の URL。パスに直して開く */
  | { type: 'file'; url: string }
  | { type: 'invalid'; reason: string }

/** URL を開いてよいか。schemes は正規化済みの並び（省略時は既定） */
export function checkExternalUrl(
  text: string,
  schemes: readonly string[] = DEFAULT_OPEN_SCHEMES
): ExternalTarget {
  let url: URL
  try {
    url = new URL(text)
  } catch {
    return { type: 'invalid', reason: `URL が正しくありません: ${text}` }
  }
  const scheme = url.protocol.slice(0, -1)
  if (!schemes.includes(scheme) || FORBIDDEN_SCHEMES.includes(scheme)) {
    return {
      type: 'invalid',
      reason: `${scheme}: は開けません（config.yaml の openSchemes で許可していません）: ${text}`
    }
  }
  return scheme === 'file'
    ? { type: 'file', url: url.toString() }
    : { type: 'url', url: url.toString() }
}

/** md・html のリンクの href を残してよいか。スキームの無い（相対・#）ものは残す */
export function hrefAllowed(
  href: string,
  schemes: readonly string[] = DEFAULT_OPEN_SCHEMES
): boolean {
  const m = /^([a-z][a-z\d+.-]+):/i.exec(href.trim())
  if (!m) return true
  const scheme = m[1].toLowerCase()
  return schemes.includes(scheme) && !FORBIDDEN_SCHEMES.includes(scheme)
}
