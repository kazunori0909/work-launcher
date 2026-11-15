import { describe, expect, it } from 'vitest'
import { classifyLine, compileRule } from './console'

describe('classifyLine', () => {
  const rules = [
    compileRule({ pattern: '\\b(error|failed)\\b', flags: 'gi', level: 'error' }),
    compileRule({ pattern: '^WARN', level: 'warn', color: '#d29922' })
  ]

  it('上から照合し、最初に当たったルールを使う', () => {
    expect(classifyLine('Build FAILED', rules)).toEqual({ level: 'error', color: undefined })
    expect(classifyLine('WARN: error', rules).level).toBe('error')
    expect(classifyLine('WARN: x', rules)).toEqual({ level: 'warn', color: '#d29922' })
    expect(classifyLine('ok', rules)).toEqual({ level: 'info' })
  })

  it('g フラグがあっても続けて照合できる', () => {
    expect(classifyLine('error', rules).level).toBe('error')
    expect(classifyLine('error', rules).level).toBe('error')
  })
})
