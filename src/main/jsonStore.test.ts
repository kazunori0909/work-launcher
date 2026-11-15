import { mkdtempSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { readJson, stringList, writeJson } from './jsonStore'

describe('jsonStore', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'json-store-'))
  const file = (name: string): string => path.join(dir, name)

  it('書いたものを読める', () => {
    writeJson(file('a.json'), ['x', 'y'])
    expect(readJson(file('a.json'), stringList, [])).toEqual(['x', 'y'])
  })

  it('無い・壊れている・形が違うときは fallback', () => {
    writeFileSync(file('broken.json'), '{')
    writeFileSync(file('object.json'), '{"a":1}')
    expect(readJson(file('none.json'), stringList, ['f'])).toEqual(['f'])
    expect(readJson(file('broken.json'), stringList, ['f'])).toEqual(['f'])
    expect(readJson(file('object.json'), stringList, ['f'])).toEqual(['f'])
  })

  it('stringList は文字列でない値を捨てる', () => {
    expect(stringList(['a', 1, null, 'b'])).toEqual(['a', 'b'])
  })
})
