// GitHub の Release 本文を作る。ダウンロードの案内（.github/release-notes.md）の後ろに、
// .github/changelog.yaml のそのバージョンの「主な変更」を続けて、標準出力に出す。
// 使い方: node scripts/release-notes.mjs <バージョン> <owner/repo>
// changelog.yaml にそのバージョンが無ければ失敗する（ノートの書き忘れをリリースの前に止める）
import { readFileSync } from 'node:fs'
import { parseChangelog, releaseNotesMarkdown } from '../src/core/changelog.ts'

const [version, repo] = process.argv.slice(2)
if (!version || !repo) {
  console.error('使い方: node scripts/release-notes.mjs <バージョン> <owner/repo>')
  process.exit(1)
}

const root = new URL('../', import.meta.url)
const head = readFileSync(new URL('.github/release-notes.md', root), 'utf-8')
  .replaceAll('{{version}}', version)
  .replaceAll('{{repo}}', repo)
const releases = parseChangelog(readFileSync(new URL('.github/changelog.yaml', root), 'utf-8'))

try {
  process.stdout.write(`${head.trimEnd()}\n\n${releaseNotesMarkdown(releases, version)}`)
} catch (e) {
  console.error(e instanceof Error ? e.message : e)
  process.exit(1)
}
