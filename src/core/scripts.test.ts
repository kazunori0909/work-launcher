import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { listScriptFiles } from './scripts'

const dir = mkdtempSync(path.join(os.tmpdir(), 'scripts-test-'))
const scripts = path.join(dir, 'scripts')
mkdirSync(path.join(scripts, 'sub'), { recursive: true })
for (const f of ['b.js', 'a.js', 'note.md', 'sub/c.js']) writeFileSync(path.join(scripts, f), '')
writeFileSync(path.join(dir, 'extra.js'), '')

describe('listScriptFiles', () => {
  it('フォルダは中の .js を名前順に（サブフォルダは見ない）、ファイルはそのまま', () => {
    expect(
      listScriptFiles([scripts, path.join(dir, 'extra.js'), path.join(scripts, 'a.js')])
    ).toEqual({
      files: [path.join(scripts, 'a.js'), path.join(scripts, 'b.js'), path.join(dir, 'extra.js')]
    })
  })

  it('無いパスを返す', () => {
    expect(listScriptFiles([path.join(dir, 'none')])).toEqual({ missing: path.join(dir, 'none') })
  })
})
