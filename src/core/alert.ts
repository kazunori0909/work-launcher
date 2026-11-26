// アラート（メモ・ヒント・重要・警告・注意）。md の `> [!NOTE]` 記法と、`note:` などの項目で使う
// （仕様は docs/config.md 3.4）

export const ALERT_KINDS = ['note', 'tip', 'important', 'warning', 'caution'] as const
export type AlertKind = (typeof ALERT_KINDS)[number]

export const isAlertKind = (s: string): s is AlertKind =>
  (ALERT_KINDS as readonly string[]).includes(s)

/** アラートの見出しのアイコン（Lucide の名前） */
export const ALERT_ICONS: Record<AlertKind, string> = {
  note: 'info',
  tip: 'lightbulb',
  important: 'message-square-exclamation-point',
  warning: 'triangle-exclamation-point',
  caution: 'octagon-exclamation-point'
}

/** md から作るアラートの要素の class。`wl-alert wl-alert-note` のように付け、描画で見出しを足す */
export const ALERT_CLASS = 'wl-alert'

// remark の構文木のうち、ここで使う形だけ（mdast の型には依存しない）
interface MdNode {
  type: string
  value?: string
  children?: MdNode[]
  data?: { hName?: string; hProperties?: Record<string, unknown> }
}

const MARKER = /^\[!(note|tip|important|warning|caution)\][ \t]*(?:\r?\n|$)/i

/**
 * remark のプラグイン。最初の行が `[!NOTE]` などだけの引用を、
 * class が `wl-alert wl-alert-<種類>` の div にする（印の行は取り除く）
 */
export function remarkAlerts() {
  return (tree: MdNode): void => walk(tree)
}

function walk(node: MdNode): void {
  for (const child of node.children ?? []) {
    if (child.type === 'blockquote') toAlert(child)
    walk(child)
  }
}

function toAlert(quote: MdNode): void {
  const para = quote.children?.[0]
  const text = para?.type === 'paragraph' ? para.children?.[0] : undefined
  if (!para || text?.type !== 'text' || text.value === undefined) return
  const m = MARKER.exec(text.value)
  if (!m) return
  text.value = text.value.slice(m[0].length)
  // 印の行のあとが空なら、その段落ごと取り除く（`> [!NOTE]` の次の行に `>` だけを書いた場合など）
  if (text.value === '' && para.children!.length === 1) quote.children!.shift()
  else if (text.value === '') para.children!.shift()
  const kind = m[1].toLowerCase()
  quote.data = { hName: 'div', hProperties: { className: [ALERT_CLASS, `${ALERT_CLASS}-${kind}`] } }
}

/** 要素の class からアラートの種類を読む。アラートでなければ undefined */
export function alertKindOf(className: string | undefined): AlertKind | undefined {
  const names = (className ?? '').split(/\s+/)
  if (!names.includes(ALERT_CLASS)) return undefined
  const kind = names.find((n) => n.startsWith(`${ALERT_CLASS}-`))?.slice(ALERT_CLASS.length + 1)
  return kind && isAlertKind(kind) ? kind : undefined
}
