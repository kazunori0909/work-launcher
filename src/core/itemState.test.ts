import { describe, expect, it } from 'vitest'
import { changeDisabled, isDisabled, NO_DISABLED, resetValues, selectValue } from './itemState'
import { defaultIcon, itemLabel } from './items'
import { errorMessage, itemsConfig, loadFiles, loadItems } from './load/testing'
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
    expect(isDisabled(NO_DISABLED, {}, item)).toBe(false)
    expect(isDisabled({ all: false, ids: ['logs'] }, {}, item)).toBe(true)
    expect(isDisabled({ all: true, ids: [] }, {}, { kind: 'open', path: 'x' })).toBe(true)
  })
})

describe('reset の項目', () => {
  it('ID か ID の並びを読み、label と icon は既定のもの', async () => {
    const { items, diagnostics } = await loadItems(`
      - select: a
        options: [x, y]
      - reset: a
      - reset: [a, a]
        label: 戻す
    `)
    expect(diagnostics).toEqual([])
    expect(items[1]).toEqual({ kind: 'reset', ids: ['a'] })
    expect(items[2]).toEqual({ kind: 'reset', ids: ['a'], label: '戻す' })
    expect(itemLabel(items[1], 'darwin')).toBe('リセット')
    expect(defaultIcon(items[1])).toBe('list-restart')
  })

  it('無い ID・中に select の無い枠・ID でない値はエラーにする', async () => {
    const { items } = await loadItems(`
      - reset: nope
      - group: 枠
        id: g
        items:
          - open: a
      - reset: g
      - reset: []
    `)
    expect(errorMessage(items[0])).toBe('reset: ID が nope の項目がありません')
    expect(errorMessage(items[2])).toContain('reset: g は')
    expect(errorMessage(items[3])).toContain('reset には戻す項目の ID')
  })
})

describe('enabledWhen・disabledWhen', () => {
  const yaml = `
    - radio: mode
      options: [debug, release]
    - checkbox: log
      on: --log
      off: ''
    - open: a
      enabledWhen: { mode: debug, log: true }
    - group: 枠
      disabledWhen: { mode: [release] }
      items:
        - open: b
  `

  it('checkbox の true / false は on・off の値にする', async () => {
    const { items, diagnostics } = await loadItems(yaml)
    expect(diagnostics).toEqual([])
    expect(items[2]).toMatchObject({
      when: { enabled: true, values: { mode: ['debug'], log: ['--log'] } }
    })
    expect(items[3]).toMatchObject({ when: { enabled: false, values: { mode: ['release'] } } })
  })

  it('enabledWhen はすべて合うときだけ押せ、disabledWhen は合うと押せない', async () => {
    const { items } = await loadItems(yaml)
    const on = { mode: 'debug', log: '--log' }
    expect(isDisabled(NO_DISABLED, on, items[2])).toBe(false)
    expect(isDisabled(NO_DISABLED, { ...on, log: '' }, items[2])).toBe(true)
    expect(isDisabled(NO_DISABLED, on, items[3])).toBe(false)
    expect(isDisabled(NO_DISABLED, { ...on, mode: 'release' }, items[3])).toBe(true)
    // ctx.disable で押せなくした分は、条件が合っても押せない
    expect(isDisabled({ all: true, ids: [] }, on, items[2])).toBe(true)
  })

  it('無い select・選択肢に無い値・両方の指定はエラーにする', async () => {
    const { items } = await loadItems(`
      - radio: mode
        options: [debug, release]
      - open: a
        enabledWhen: { nope: x }
      - open: b
        enabledWhen: { mode: test }
      - open: c
        enabledWhen: { mode: debug }
        disabledWhen: { mode: release }
      - open: d
        enabledWhen: mode
    `)
    expect(errorMessage(items[1])).toBe(
      'enabledWhen: ID が nope の select・radio・checkbox がありません'
    )
    expect(errorMessage(items[2])).toContain('test は mode の選択肢にありません')
    expect(errorMessage(items[3])).toContain('どちらか一方だけ')
    expect(errorMessage(items[4])).toContain('enabledWhen は「select の ID: 値」')
  })

  it('見出しなど押せない項目には書けない（未知のキー）', async () => {
    const { diagnostics } = await loadItems(`
      - radio: mode
        options: [debug, release]
      - heading: 見出し
        enabledWhen: { mode: debug }
    `)
    expect(diagnostics.map((d) => d.message)).toEqual([
      expect.stringContaining('未知のキー enabledWhen')
    ])
  })
})
