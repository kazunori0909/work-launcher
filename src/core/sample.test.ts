import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { expect, it } from 'vitest'
import { loadConsoleRules, loadProject } from './load'
import type { ReadFile } from './load'

// サンプル案件を読んだ結果を固定する。読み込みの作りを変えても、結果が変わらないことを確かめる
const DIR = path.resolve(__dirname, '../../examples/sample')

// 個人用の *.local.yaml は追跡していないため、置いてあっても読まない
const read: ReadFile = async (p) => {
  if (/\.local\.yaml$/.test(p)) return undefined
  try {
    return await readFile(p, 'utf8')
  } catch {
    return undefined
  }
}

it('サンプル案件の読み込み結果', async () => {
  const project = await loadProject(DIR, read)
  const console = await loadConsoleRules(DIR, read)
  expect(project.diagnostics).toEqual([])
  expect(console.diagnostics).toEqual([])
  expect({ project: project.project, consoleRules: console.rules }).toMatchSnapshot()
})
