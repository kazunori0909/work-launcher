export type OfficeKind = 'excel' | 'powerpoint' | 'word'

export interface OfficeLaunch {
  command: string
  args: string[]
  /** 開くファイルは環境変数で渡す（PowerShell の引用符の扱いで空白・日本語が崩れないように） */
  env: Record<string, string>
  /** 起動に失敗したら OS の既定アプリで開き直す */
  fallbackToDefault: boolean
}

export const OFFICE_FILE_ENV = 'WORK_LAUNCHER_FILE'

const WIN_EXE: Record<OfficeKind, string> = {
  excel: 'excel',
  powerpoint: 'powerpnt',
  word: 'winword'
}
const MAC_APP: Record<OfficeKind, string> = {
  excel: 'Microsoft Excel',
  powerpoint: 'Microsoft PowerPoint',
  word: 'Microsoft Word'
}

/** Windows で実行する PowerShell。Start-Process は App Paths から excel・powerpnt・winword を探す */
export function windowsOfficeScript(kind: OfficeKind, readonly: boolean): string {
  const file = `$env:${OFFICE_FILE_ENV}`
  // 読み取り専用の起動オプションは Excel の /r だけ（Word の /r は登録し直しで別物）。
  // PowerPoint・Word は COM で読み取り専用で開く
  if (kind === 'powerpoint' && readonly) {
    // Presentations.Open(FileName, ReadOnly, Untitled, WithWindow)。-1 は msoTrue、0 は msoFalse
    return [
      '$app = New-Object -ComObject PowerPoint.Application',
      '$app.Visible = -1',
      `[void]$app.Presentations.Open(${file}, -1, 0, -1)`,
      '$app.Activate()'
    ].join('; ')
  }
  if (kind === 'word' && readonly) {
    // Documents.Open(FileName, ConfirmConversions, ReadOnly)
    return [
      '$app = New-Object -ComObject Word.Application',
      '$app.Visible = $true',
      `[void]$app.Documents.Open(${file}, $false, $true)`,
      '$app.Activate()'
    ].join('; ')
  }
  const args = [...(readonly ? ["'/r'"] : []), `('"' + ${file} + '"')`].join(', ')
  return `Start-Process -FilePath '${WIN_EXE[kind]}' -ArgumentList @(${args})`
}

/**
 * excel・powerpoint・word の項目を開くコマンド。Mac は Office で開き、入っていなければ既定のアプリ
 * （Numbers・Keynote・Pages など）で開く。readonly は Windows だけ効く（docs/config.md 3.1）
 */
export function officeLaunch(
  kind: OfficeKind,
  file: string,
  readonly: boolean,
  platform: NodeJS.Platform
): OfficeLaunch {
  if (platform === 'win32') {
    return {
      command: 'powershell.exe',
      args: [
        '-NoProfile',
        '-NonInteractive',
        '-ExecutionPolicy',
        'Bypass',
        '-Command',
        windowsOfficeScript(kind, readonly)
      ],
      env: { [OFFICE_FILE_ENV]: file },
      fallbackToDefault: false
    }
  }
  return {
    command: 'open',
    args: ['-a', MAC_APP[kind], file],
    env: {},
    fallbackToDefault: true
  }
}
