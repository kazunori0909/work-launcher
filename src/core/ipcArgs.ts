// 画面から IPC で来た引数を確かめる。画面は信用しない前提で、型が違えば undefined にする

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function asString(v: unknown): string | undefined {
  return typeof v === 'string' ? v : undefined
}

export function asNumber(v: unknown): number | undefined {
  return typeof v === 'number' && Number.isFinite(v) ? v : undefined
}

/** 項目の位置の並び（0 以上の整数の並び） */
export function asItemPath(v: unknown): number[] | undefined {
  return Array.isArray(v) && v.every((i) => Number.isInteger(i) && i >= 0) ? v : undefined
}

/** 画面で選んでいる select の値。文字列でない値は捨てる */
export function asSelect(v: unknown): Record<string, string> {
  if (!isRecord(v)) return {}
  return Object.fromEntries(
    Object.entries(v).filter((e): e is [string, string] => typeof e[1] === 'string')
  )
}

/** 項目を指す引数（ページ ID・位置・select の値） */
export interface ItemRef {
  pageId: string
  path: number[]
  select: Record<string, string>
}

export function asItemRef(pageId: unknown, path: unknown, select: unknown): ItemRef | undefined {
  const id = asString(pageId)
  const p = asItemPath(path)
  return id === undefined || p === undefined
    ? undefined
    : { pageId: id, path: p, select: asSelect(select) }
}
