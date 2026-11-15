import { describe, expect, it } from 'vitest'
import { OFFICE_FILE_ENV, officeLaunch, windowsOfficeScript } from './office'

describe('officeLaunch', () => {
  it('Windows はファイルを環境変数で渡して PowerShell で開く', () => {
    const file = 'C:\\案件 A\\仕様書.xlsx'
    const l = officeLaunch('excel', file, true, 'win32')
    expect(l.command).toBe('powershell.exe')
    expect(l.args.at(-1)).toBe(windowsOfficeScript('excel', true))
    expect(l.args.join(' ')).not.toContain(file)
    expect(l.env).toEqual({ [OFFICE_FILE_ENV]: file })
    expect(l.fallbackToDefault).toBe(false)
  })

  it('Mac は Office で開き、失敗したら既定のアプリに回す。readonly は無視する', () => {
    const l = officeLaunch('powerpoint', '/repo/a b.pptx', true, 'darwin')
    expect(l).toEqual({
      command: 'open',
      args: ['-a', 'Microsoft PowerPoint', '/repo/a b.pptx'],
      env: {},
      fallbackToDefault: true
    })
  })
})

describe('windowsOfficeScript', () => {
  it('Excel の readonly は /r を付ける', () => {
    expect(windowsOfficeScript('excel', true)).toBe(
      `Start-Process -FilePath 'excel' -ArgumentList @('/r', ('"' + $env:${OFFICE_FILE_ENV} + '"'))`
    )
    expect(windowsOfficeScript('excel', false)).not.toContain('/r')
  })

  it('PowerPoint は通常 Start-Process、readonly は COM で開く', () => {
    expect(windowsOfficeScript('powerpoint', false)).toContain("-FilePath 'powerpnt'")
    const ro = windowsOfficeScript('powerpoint', true)
    expect(ro).toContain('PowerPoint.Application')
    expect(ro).toContain(`Presentations.Open($env:${OFFICE_FILE_ENV}, -1, 0, -1)`)
  })

  it('Word は通常 Start-Process、readonly は COM で開く（/r は登録し直しなので付けない）', () => {
    expect(windowsOfficeScript('word', false)).toContain("-FilePath 'winword'")
    const ro = windowsOfficeScript('word', true)
    expect(ro).toContain('Word.Application')
    expect(ro).toContain(`Documents.Open($env:${OFFICE_FILE_ENV}, $false, $true)`)
    expect(ro).not.toContain('/r')
  })

  it('Mac の Word は Microsoft Word で開く', () => {
    expect(officeLaunch('word', '/repo/a.docx', false, 'darwin').args).toEqual([
      '-a',
      'Microsoft Word',
      '/repo/a.docx'
    ])
  })
})
