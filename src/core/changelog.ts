import { parse } from 'yaml'

// リリースノート（.github/changelog.yaml）の読み込みと、GitHub の Release 本文への書き出し。
// サイト（site/）と scripts/release-notes.mjs の両方が使う。Node が型を外して直接読むので、
// 型だけの import と、型を消せば動く書き方にとどめる（enum などは使わない）

/** 1つの変更。ja と en の両方を書く */
export interface ChangeText {
  ja: string
  en: string
}

/** 変更の種類。並びは表示の順（破壊的変更を先に出す） */
export const CHANGE_KINDS = ['breaking', 'added', 'changed', 'fixed'] as const
export type ChangeKind = (typeof CHANGE_KINDS)[number]

export interface Release {
  /** 0.3.0 のようなバージョン。まだ出していない変更は unreleased */
  version: string
  /** 公開した日（日本時間、YYYY-MM-DD）。unreleased には書かない */
  date?: string
  /** 一言の要約（任意） */
  summary?: ChangeText
  changes: Partial<Record<ChangeKind, ChangeText[]>>
}

export const UNRELEASED = 'unreleased'

const SEMVER = /^\d+\.\d+\.\d+$/
const DATE = /^\d{4}-\d{2}-\d{2}$/

/** 種類ごとの見出し（GitHub の Release 本文で使う。サイトは site/src/i18n.ts） */
const HEADINGS: Record<ChangeKind, string> = {
  breaking: '破壊的変更 / Breaking changes',
  added: '新機能 / New',
  changed: '変更 / Changed',
  fixed: '修正 / Fixed'
}

function text(v: unknown, where: string): ChangeText {
  const o = v as Partial<ChangeText> | null
  if (typeof o?.ja !== 'string' || typeof o?.en !== 'string' || !o.ja.trim() || !o.en.trim()) {
    throw new Error(`${where}: ja と en の両方を書いてください`)
  }
  return { ja: o.ja.trim(), en: o.en.trim() }
}

/** changelog.yaml を読む。書き方が違えば、どこが違うかを例外で返す */
export function parseChangelog(source: string): Release[] {
  const doc = parse(source) as unknown
  if (!Array.isArray(doc)) throw new Error('changelog.yaml はバージョンの配列で書いてください')
  const releases = doc.map((raw: Record<string, unknown>, i): Release => {
    const version = String(raw?.version ?? '')
    const where = `${i + 1}つ目（${version || 'version なし'}）`
    if (version !== UNRELEASED && !SEMVER.test(version)) {
      throw new Error(`${where}: version は 0.3.0 の形か unreleased で書いてください`)
    }
    if (version !== UNRELEASED && !DATE.test(String(raw.date ?? ''))) {
      throw new Error(`${where}: date を YYYY-MM-DD で書いてください`)
    }
    const known = new Set(['version', 'date', 'summary', ...CHANGE_KINDS])
    const unknown = Object.keys(raw).filter((k) => !known.has(k))
    if (unknown.length) throw new Error(`${where}: 知らないキー ${unknown.join(', ')}`)
    const changes: Release['changes'] = {}
    for (const kind of CHANGE_KINDS) {
      const list = raw[kind]
      if (list === undefined) continue
      if (!Array.isArray(list)) throw new Error(`${where}: ${kind} は配列で書いてください`)
      changes[kind] = list.map((v, j) => text(v, `${where} の ${kind} の ${j + 1}つ目`))
    }
    return {
      version,
      ...(raw.date !== undefined && { date: String(raw.date) }),
      ...(raw.summary !== undefined && { summary: text(raw.summary, `${where} の summary`) }),
      changes
    }
  })
  checkOrder(releases)
  return releases
}

/** unreleased は先頭に1つまで。バージョンは新しい順で重ならない */
function checkOrder(releases: Release[]): void {
  releases.forEach((r, i) => {
    if (r.version === UNRELEASED && i !== 0) throw new Error('unreleased は先頭に書いてください')
  })
  const versions = releases.filter((r) => r.version !== UNRELEASED).map((r) => r.version)
  for (let i = 1; i < versions.length; i++) {
    if (compareVersions(versions[i - 1], versions[i]) <= 0) {
      throw new Error(`新しい順に書いてください（${versions[i - 1]} の次に ${versions[i]}）`)
    }
  }
}

export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i]
  return 0
}

/** 公開したバージョンだけ（サイトに出すもの） */
export const released = (releases: Release[]): Release[] =>
  releases.filter((r) => r.version !== UNRELEASED)

export const hasBreaking = (r: Release): boolean => (r.changes.breaking?.length ?? 0) > 0

/**
 * GitHub の Release 本文に入れる「主な変更」。日本語の行の下に「/ 英語」を続ける（これまでの書き方）。
 * 書いていないバージョンなら例外（リリースの前にノートを書き忘れないため）
 */
export function releaseNotesMarkdown(releases: Release[], version: string): string {
  const r = releases.find((x) => x.version === version)
  if (!r) {
    throw new Error(
      `.github/changelog.yaml に ${version} がありません（unreleased を書き換えてください）`
    )
  }
  const lines = ['## 主な変更 / Highlights', '']
  if (r.summary) lines.push(r.summary.ja, `/ ${r.summary.en}`, '')
  for (const kind of CHANGE_KINDS) {
    const list = r.changes[kind]
    if (!list?.length) continue
    lines.push(`### ${HEADINGS[kind]}`, '')
    for (const c of list) lines.push(`- ${c.ja}`, `  / ${c.en}`)
    lines.push('')
  }
  return lines.join('\n')
}
