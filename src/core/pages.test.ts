import { describe, expect, it } from 'vitest'
import { pageLayout } from './pages'
import type { Project } from './types'

const project = (...ids: string[]): Project => ({
  styles: [],
  scripts: [],
  pages: ids.map((id) => ({ id, items: [] })),
  info: { env: [], tools: [], registry: [] }
})
const ids = (pages: { id: string }[]): string[] => pages.map((p) => p.id)

describe('pageLayout', () => {
  it('help・info はタブの並びから除き、別に持つ', () => {
    const l = pageLayout(project('help', 'a', 'info', 'b'), undefined)
    expect(ids(l.pages)).toEqual(['a', 'b'])
    expect(l.userHelp?.id).toBe('help')
    expect(l.userInfo?.id).toBe('info')
  })

  it('選んだページ → top → 最初のページ', () => {
    expect(pageLayout(project('a', 'top', 'b'), 'b').current?.id).toBe('b')
    expect(pageLayout(project('a', 'top', 'b'), undefined).current?.id).toBe('top')
    expect(pageLayout(project('a', 'top'), 'gone').current?.id).toBe('top')
    expect(pageLayout(project('a', 'b'), undefined).current?.id).toBe('a')
    expect(pageLayout(project(), undefined).current).toBeUndefined()
  })

  it('ヘルプ・Info を開いたら、設定の help・info のページ（無ければ無し）', () => {
    const l = pageLayout(project('a', 'help'), 'help')
    expect(l.helpOpen).toBe(true)
    expect(l.current?.id).toBe('help')
    const info = pageLayout(project('a'), 'info')
    expect(info.infoOpen).toBe(true)
    expect(info.current).toBeUndefined()
  })
})
