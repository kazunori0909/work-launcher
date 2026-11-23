import { describe, expect, it } from 'vitest'
import { changeDisabled, isDisabled, NO_DISABLED, resetValues, selectValue } from './itemState'
import { loadFiles, itemsConfig } from './load/testing'
import { CONFIG_FILE } from './load'
import type { Project } from './types'

async function project(): Promise<Project> {
  const r = await loadFiles({
    [CONFIG_FILE]: itemsConfig(`
      - open: logs
        id: logs
      - group: 資料
        id: docs
        items:
          - open: a.txt
      - heading: 見出し
        id: title
      - select: target
        options: [dev, prod]
      - checkbox: dry
        on: --dry-run
        off: ''
        remember: true
      - group: デバッグ
        id: debug
        items:
          - select: level
            options: [low, middle, high]
            default: middle
          - checkbox: file
            default: true
    `)
  })
  return r.project!
}

describe('changeDisabled', () => {
  it('ID を足し引きする。同じ ID は重ねない', async () => {
    const p = await project()
    const r1 = changeDisabled(p, NO_DISABLED, ['logs', 'target'], false)
    expect(r1).toEqual({ disabled: { all: false, ids: ['logs', 'target'] } })
    if (!('disabled' in r1)) throw new Error()
    const r2 = changeDisabled(p, r1.disabled, ['logs', 'docs'], false)
    expect(r2).toEqual({ disabled: { all: false, ids: ['target', 'logs', 'docs'] } })
    expect(changeDisabled(p, r1.disabled, ['logs'], true)).toEqual({
      disabled: { all: false, ids: ['target'] }
    })
  })

  it('ID を省くと全部を切り替える。ID で押せなくした分は保つ', async () => {
    const p = await project()
    const some = { all: false, ids: ['logs'] }
    expect(changeDisabled(p, some, undefined, false)).toEqual({
      disabled: { all: true, ids: ['logs'] }
    })
    expect(changeDisabled(p, { all: true, ids: ['logs'] }, undefined, true)).toEqual({
      disabled: { all: false, ids: ['logs'] }
    })
    // 全部を押せなくしている間は、1つだけ戻しても all のまま
    expect(changeDisabled(p, { all: true, ids: ['logs'] }, ['logs'], true)).toEqual({
      disabled: { all: true, ids: [] }
    })
  })

  it('無い ID・押せる項目でない ID は誤りにする', async () => {
    const p = await project()
    expect(changeDisabled(p, NO_DISABLED, ['nope'], false)).toEqual({
      error: 'ID が nope の項目がありません'
    })
    expect(changeDisabled(p, NO_DISABLED, ['title'], false)).toMatchObject({
      error: expect.stringContaining('title は押せる項目ではありません')
    })
  })
})

describe('selectValue', () => {
  it('選択肢の値を確かめる。checkbox は true / false を on・off の値にする', async () => {
    const p = await project()
    expect(selectValue(p, 'target', 'prod')).toEqual({ value: 'prod', remember: false })
    expect(selectValue(p, 'dry', true)).toEqual({ value: '--dry-run', remember: true })
    expect(selectValue(p, 'dry', false)).toEqual({ value: '', remember: true })
    expect(selectValue(p, 'dry', '--dry-run')).toEqual({ value: '--dry-run', remember: true })
  })

  it('無い ID・選択肢に無い値・checkbox でない true / false は誤りにする', async () => {
    const p = await project()
    expect(selectValue(p, 'logs', 'x')).toEqual({
      error: 'ID が logs の select・radio・checkbox がありません'
    })
    expect(selectValue(p, 'target', 'stg')).toEqual({
      error: 'stg は target の選択肢にありません（選べるのは dev / prod）'
    })
    expect(selectValue(p, 'target', true)).toEqual({
      error: 'true / false で書けるのは checkbox だけです'
    })
  })
})

describe('resetValues', () => {
  it('初期値に戻す。default、無ければ最初の選択肢。checkbox は default が無ければオフ', async () => {
    const p = await project()
    expect(resetValues(p, ['target', 'dry'])).toEqual({
      select: { target: 'dev', dry: '' },
      remember: ['dry']
    })
    expect(resetValues(p, ['level', 'file'])).toEqual({
      select: { level: 'middle', file: 'true' },
      remember: []
    })
  })

  it('group の ID なら中の項目、ID を省くと全部', async () => {
    const p = await project()
    expect(resetValues(p, ['debug'])).toEqual({
      select: { level: 'middle', file: 'true' },
      remember: []
    })
    expect(resetValues(p, undefined)).toMatchObject({
      select: { target: 'dev', dry: '', level: 'middle', file: 'true' }
    })
  })

  it('無い ID・select の無い ID は誤りにする', async () => {
    const p = await project()
    expect(resetValues(p, ['nope'])).toEqual({ error: 'ID が nope の項目がありません' })
    expect(resetValues(p, ['docs'])).toEqual({
      error: 'docs は select・radio・checkbox でなく、中にも select・radio・checkbox がありません'
    })
    expect(resetValues(p, ['logs'])).toMatchObject({ error: expect.stringContaining('logs は') })
  })
})

describe('isDisabled', () => {
  it('all か、項目の id が並びにあれば押せない', () => {
    const item = { kind: 'open', id: 'logs', path: 'logs' } as const
    expect(isDisabled(NO_DISABLED, item)).toBe(false)
    expect(isDisabled({ all: false, ids: ['logs'] }, item)).toBe(true)
    expect(isDisabled({ all: true, ids: [] }, { kind: 'open', path: 'x' })).toBe(true)
  })
})
