import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { findItem, launcherDirNextToApp, loadProjectView } from './project'

describe('launcherDirNextToApp', () => {
  const root = mkdtempSync(path.join(os.tmpdir(), 'next-to-app-'))
  const withProject = path.join(root, 'with')
  const without = path.join(root, 'without')
  mkdirSync(withProject)
  mkdirSync(without)
  writeFileSync(path.join(withProject, 'work.launcher'), '')

  it('exe と同じフォルダに work.launcher があれば、そのフォルダ', () => {
    expect(launcherDirNextToApp(path.join(withProject, 'WorkLauncher.exe'), {})).toBe(withProject)
    expect(launcherDirNextToApp(path.join(without, 'WorkLauncher.exe'), {})).toBeUndefined()
  })

  it('ポータブル版は、展開先ではなく元の exe の置き場所を見る', () => {
    const extracted = path.join(without, 'WorkLauncher.exe')
    expect(launcherDirNextToApp(extracted, { PORTABLE_EXECUTABLE_DIR: withProject })).toBe(
      withProject
    )
  })
})

describe('loadProjectView・findItem', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'project-view-'))
  mkdirSync(path.join(dir, 'launcher'))
  writeFileSync(path.join(dir, 'work.launcher'), '')
  writeFileSync(path.join(dir, 'launcher/style.css'), '.app { color: red }')
  writeFileSync(path.join(dir, 'launcher/notes.md'), '# メモ')
  writeFileSync(
    path.join(dir, 'launcher/config.yaml'),
    `version: 1
style: launcher/style.css
pages:
  - id: top
    items:
      - md: launcher/notes.md
      - md: launcher/none.md
      - group: g
        items:
          - open: a
`
  )

  it('style・md を読み、読もうとしたファイルを返す。無い md は警告', async () => {
    const { view, files } = await loadProjectView(dir)
    expect(view.css).toEqual(['.app { color: red }'])
    expect(view.mdfiles['launcher/notes.md']).toEqual({ path: 'launcher/notes.md', text: '# メモ' })
    expect(view.mdfiles['launcher/none.md']).toEqual({ path: 'launcher/none.md', text: undefined })
    expect(view.diagnostics).toMatchObject([
      { level: 'warning', message: expect.stringContaining('launcher/none.md') }
    ])
    expect(files).toContain(path.join(dir, 'launcher/config.local.yaml'))
  })

  it('案件が無ければ開始画面の中身', async () => {
    const { view, files } = await loadProjectView(undefined)
    expect(view.launcherDir).toBeUndefined()
    expect(files).toEqual([])
  })

  it('ページ ID と位置の並びで項目を探す', async () => {
    const { view } = await loadProjectView(dir)
    expect(findItem(view, 'top', [2, 0])?.item).toEqual({ kind: 'open', path: 'a' })
    expect(findItem(view, 'top', [9])).toBeUndefined()
    expect(findItem(view, 'none', [0])).toBeUndefined()
    expect(findItem(undefined, 'top', [0])).toBeUndefined()
  })
})
