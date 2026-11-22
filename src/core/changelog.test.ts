import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  compareVersions,
  hasBreaking,
  parseChangelog,
  released,
  releaseNotesMarkdown
} from './changelog'

const CHANGELOG = readFileSync(new URL('../../.github/changelog.yaml', import.meta.url), 'utf-8')
const PACKAGE_VERSION = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf-8')
).version as string

describe('リリースノート（.github/changelog.yaml）', () => {
  const releases = parseChangelog(CHANGELOG)

  it('書き方どおりに読める', () => {
    expect(released(releases).length).toBeGreaterThan(0)
  })

  it('package.json のバージョンが載っている（上げたら unreleased を書き換える）', () => {
    expect(releases.map((r) => r.version)).toContain(PACKAGE_VERSION)
  })

  it('ja の句読点のあとに空白が無い（>- で行を分けたときに入る）', () => {
    const ja = releases.flatMap((r) => [
      ...(r.summary ? [r.summary.ja] : []),
      ...Object.values(r.changes).flatMap((list) => list.map((c) => c.ja))
    ])
    expect(ja.filter((t) => /[、。] /.test(t))).toEqual([])
  })

  it('Release 本文の「主な変更」を作れる', () => {
    const md = releaseNotesMarkdown(releases, PACKAGE_VERSION)
    expect(md).toMatch(/^## 主な変更 \/ Highlights/)
  })
})

describe('parseChangelog', () => {
  it('種類ごとに ja と en を読む', () => {
    const [r] = parseChangelog(`
- version: 1.0.0
  date: 2026-01-02
  breaking:
    - { ja: 変えた, en: Changed }
`)
    expect(r).toEqual({
      version: '1.0.0',
      date: '2026-01-02',
      changes: { breaking: [{ ja: '変えた', en: 'Changed' }] }
    })
    expect(hasBreaking(r)).toBe(true)
  })

  it('en が無ければ、どこかを示して例外', () => {
    expect(() =>
      parseChangelog(`
- version: 1.0.0
  date: 2026-01-02
  added:
    - { ja: 足した }
`)
    ).toThrow('1つ目（1.0.0） の added の 1つ目: ja と en の両方を書いてください')
  })

  it('date の無い公開済みのバージョンは例外', () => {
    expect(() => parseChangelog('- version: 1.0.0')).toThrow('date を YYYY-MM-DD')
  })

  it('知らないキーは例外', () => {
    expect(() => parseChangelog('- { version: 1.0.0, date: 2026-01-02, feature: [] }')).toThrow(
      '知らないキー feature'
    )
  })

  it('古い順や unreleased が途中にあるのは例外', () => {
    expect(() =>
      parseChangelog(`
- { version: 1.0.0, date: 2026-01-01 }
- { version: 1.1.0, date: 2026-01-02 }
`)
    ).toThrow('新しい順')
    expect(() =>
      parseChangelog(`
- { version: 1.0.0, date: 2026-01-01 }
- { version: unreleased }
`)
    ).toThrow('unreleased は先頭')
  })
})

describe('releaseNotesMarkdown', () => {
  const releases = parseChangelog(`
- version: 1.0.0
  date: 2026-01-02
  summary: { ja: 要約, en: Summary }
  added:
    - { ja: 足した, en: Added }
  breaking:
    - { ja: 変えた, en: Changed }
`)

  it('破壊的変更を先に、日本語の下に英語を続ける', () => {
    expect(releaseNotesMarkdown(releases, '1.0.0')).toBe(
      [
        '## 主な変更 / Highlights',
        '',
        '要約',
        '/ Summary',
        '',
        '### 破壊的変更 / Breaking changes',
        '',
        '- 変えた',
        '  / Changed',
        '',
        '### 新機能 / New',
        '',
        '- 足した',
        '  / Added',
        ''
      ].join('\n')
    )
  })

  it('載っていないバージョンは例外', () => {
    expect(() => releaseNotesMarkdown(releases, '2.0.0')).toThrow('2.0.0 がありません')
  })
})

describe('compareVersions', () => {
  it('数字として比べる', () => {
    expect(compareVersions('0.10.0', '0.9.9')).toBeGreaterThan(0)
    expect(compareVersions('1.0.0', '1.0.0')).toBe(0)
  })
})
