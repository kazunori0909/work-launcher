import { describe, expect, it } from 'vitest'
import { MAX_RECENT, pushRecent, recentJumpTasks, samePath } from './recent'

describe('samePath', () => {
  it('Windows・Mac は大文字と小文字・末尾の区切りを区別しない', () => {
    expect(samePath('/a/Proj/', '/a/proj', 'darwin')).toBe(true)
    expect(samePath('/a/Proj', '/a/proj', 'win32')).toBe(true)
    expect(samePath('/a/Proj', '/a/proj', 'linux')).toBe(false)
  })
})

describe('pushRecent', () => {
  it('先頭に足し、同じフォルダは前の位置から除く', () => {
    expect(pushRecent(['/a', '/b', '/c'], '/B', 'darwin')).toEqual(['/B', '/a', '/c'])
  })

  it(`最大 ${MAX_RECENT} 件`, () => {
    const list = Array.from({ length: MAX_RECENT }, (_, i) => `/p${i}`)
    const next = pushRecent(list, '/new', 'darwin')
    expect(next).toHaveLength(MAX_RECENT)
    expect(next[0]).toBe('/new')
    expect(next).not.toContain(`/p${MAX_RECENT - 1}`)
  })
})

describe('recentJumpTasks', () => {
  it('フォルダ名を表示し、work.launcher を引数にして exe を起動する', () => {
    const exe = 'C:\\Program Files\\WorkLauncher\\WorkLauncher.exe'
    expect(recentJumpTasks(['C:\\work\\proj-a\\'], exe, 'work.launcher')).toEqual([
      {
        type: 'task',
        title: 'proj-a',
        description: 'C:\\work\\proj-a\\',
        program: exe,
        args: '"C:\\work\\proj-a\\work.launcher"',
        iconPath: exe,
        iconIndex: 0
      }
    ])
  })

  it('ドライブの直下は、パスをそのまま表示する', () => {
    expect(recentJumpTasks(['D:\\'], 'x.exe', 'work.launcher')[0]?.title).toBe('D:\\')
  })
})
