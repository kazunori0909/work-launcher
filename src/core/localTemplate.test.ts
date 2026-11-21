import { describe, expect, it } from 'vitest'
import type { LoadResult } from './load'
import { loadFiles } from './load/testing'
import { localConfigTemplate } from './localTemplate'

const CONFIG = 'launcher/config.yaml'
const LOCAL = 'launcher/config.local.yaml'

/** config.yaml から雛形を作り、それを重ねて読み直す */
async function withTemplate(config: string): Promise<{ merged: LoadResult }> {
  const base = await loadFiles({ [CONFIG]: config })
  if (!base.project) throw new Error('config.yaml を読めません')
  const template = localConfigTemplate(base.project)
  return { merged: await loadFiles({ [CONFIG]: config, [LOCAL]: template }) }
}

describe('localConfigTemplate', () => {
  it('最初のページに md を足し、新しいページを足し、ツールを git だけにする', async () => {
    const { merged } = await withTemplate(`
version: 1
pages:
  - id: help
    items: []
  - id: main
    items:
      - url: https://example.com
  - id: my-page
    items: []
info:
  tools:
    - node
    - git
    - { name: Maven Tool, command: mvn -v }
`)
    expect(merged.diagnostics).toEqual([])
    const pages = merged.project!.pages
    expect(pages.map((p) => p.id)).toEqual(['help', 'main', 'my-page', 'my-page-2'])
    expect(pages[1].items.map((i) => i.kind)).toEqual(['url', 'markdown'])
    expect(pages[3]).toMatchObject({ title: '自分用', icon: 'user' })
    expect(merged.project!.info.tools.map((t) => t.name)).toEqual(['git'])
  })

  it('案件に git が無ければ足す。ページが無くても新しいページは足す', async () => {
    const { merged } = await withTemplate('version: 1\npages: []\ninfo:\n  tools: [node]')
    expect(merged.diagnostics).toEqual([])
    expect(merged.project!.pages.map((p) => p.id)).toEqual(['my-page'])
    expect(merged.project!.info.tools.map((t) => t.name)).toEqual(['git'])
  })
})
