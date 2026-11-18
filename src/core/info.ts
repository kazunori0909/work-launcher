// Info ページの値の形と、コマンド出力の読み取り。
// 画面（コピー用のテキスト）とメインの両方から使うため、node: モジュールに依存させない

export interface DriveInfo {
  name: string
  mountPoint: string
  /** ネットワークドライブ（smbfs・nfs など） */
  network: boolean
  /** 取れなかった（応答が無いネットワークドライブなど）ときは undefined */
  totalBytes?: number
  freeBytes?: number
}

export interface GpuInfo {
  model: string
  cores?: string
  /** Metal のバージョン（Mac） */
  metal?: string
  /** ドライバーのバージョン（Windows の表記） */
  driver?: string
  /** GPU メーカーの表記のドライバーのバージョン（NVIDIA） */
  vendorDriver?: string
}

export interface ToolInfo {
  name: string
  /** 見つからない・失敗したときは undefined */
  version?: string
  /** この OS では取れない（Windows だけの組み込みツールなど） */
  unsupported?: boolean
}

/** 刺さっているメモリの内訳（Windows） */
export interface MemoryModules {
  /** 1枚ずつの容量 */
  sizes: number[]
  /** DDR4 など */
  type?: string
  speedMHz?: number
  /** スロットの数（空きを含む） */
  slots?: number
}

export interface LanguageInfo {
  /** OS の表示言語（優先する順） */
  display: string[]
  /** 地域（日付・数値の形式） */
  region: string
  /** Unicode に対応していないプログラム向けの設定（Windows）。codePage はコンソールのもの */
  systemLocale?: { name: string; codePage?: number }
}

export interface SystemInfo {
  os: { name: string; version: string; build?: string; arch: string }
  language: LanguageInfo
  computerName: string
  userName: string
  cpu: { model: string; cores: number }
  /** totalBytes は OS が使える量（刺さっている合計よりハードウェアの予約分だけ少ない） */
  memory: { totalBytes: number; usedBytes?: number; modules?: MemoryModules }
  gpus: GpuInfo[]
  drives: DriveInfo[]
  /** ネットワーク部品ごとの IPv4 */
  addresses: { name: string; address: string }[]
  env: { name: string; value?: string }[]
  /** Windows だけ（ほかの OS では undefined）。値が無ければ value は undefined */
  registry?: { name: string; path: string; value?: string }[]
  tools: ToolInfo[]
  app: { version: string; electron: string }
  /** 取れなかった項目の説明 */
  problems: string[]
}

/** `Key: value` の行を読む（sw_vers など） */
export function parseKeyValues(text: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of text.split(/\r?\n/)) {
    const m = /^([^:]+):\s*(.*)$/.exec(line)
    if (m) result[m[1].trim()] = m[2].trim()
  }
  return result
}

/**
 * vm_stat から使用中のメモリを求める。アクティビティモニタの「使用済みメモリ」に近い
 * アクティブ + 固定 + 圧縮で占有、の合計にする（キャッシュとして空けられる分は含めない）
 */
export function usedMemoryFromVmStat(text: string): number | undefined {
  const pageSize = Number(/page size of (\d+) bytes/.exec(text)?.[1])
  const pages = (label: string): number =>
    Number(new RegExp(`^${label}:\\s+(\\d+)`, 'm').exec(text)?.[1] ?? NaN)
  const used =
    pages('Pages active') + pages('Pages wired down') + pages('Pages occupied by compressor')
  return Number.isFinite(used) && pageSize > 0 ? used * pageSize : undefined
}

export interface Mount {
  device: string
  mountPoint: string
  type: string
  flags: string[]
}

/** macOS の mount の出力を読む（`/dev/disk3s1s1 on / (apfs, sealed, local)`） */
export function parseMount(text: string): Mount[] {
  const mounts: Mount[] = []
  for (const line of text.split(/\r?\n/)) {
    const m = /^(.+?) on (.+) \(([^,)]+)(?:, ([^)]*))?\)$/.exec(line)
    if (!m) continue
    mounts.push({
      device: m[1],
      mountPoint: m[2],
      type: m[3],
      flags: m[4] ? m[4].split(',').map((f) => f.trim()) : []
    })
  }
  return mounts
}

const NETWORK_TYPES = ['smbfs', 'nfs', 'afpfs', 'webdav', 'cifs']

/**
 * `hdiutil info` の出力から、ディスクイメージ（dmg など）をマウントした先を読む
 * （`/dev/disk4s1<TAB>Apple_HFS<TAB>/Volumes/Name` の3列目）
 */
export function parseImageMountPoints(text: string): string[] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.startsWith('/dev/'))
    .map((line) => line.split('\t')[2]?.trim())
    .filter((p): p is string => !!p)
}

/**
 * Finder に出るボリュームだけを選ぶ（起動ディスクと /Volumes の下。nobrowse は除く）。
 * ディスクイメージ（imageMountPoints）はアプリのインストーラなどで、PC の情報ではないため除く
 */
export function selectDrives(
  mounts: Mount[],
  imageMountPoints: string[] = []
): Omit<DriveInfo, 'totalBytes' | 'freeBytes'>[] {
  return mounts
    .filter(
      (m) =>
        m.mountPoint === '/' ||
        (m.mountPoint.startsWith('/Volumes/') &&
          !m.flags.includes('nobrowse') &&
          !imageMountPoints.includes(m.mountPoint))
    )
    .map((m) => ({
      name: m.mountPoint === '/' ? '起動ディスク' : m.mountPoint.slice('/Volumes/'.length),
      mountPoint: m.mountPoint,
      network: NETWORK_TYPES.includes(m.type)
    }))
}

/** `system_profiler SPDisplaysDataType -json` の出力から GPU を読む */
export function parseDisplays(json: string): GpuInfo[] {
  let data: unknown
  try {
    data = JSON.parse(json)
  } catch {
    return []
  }
  const list = (data as { SPDisplaysDataType?: Record<string, unknown>[] }).SPDisplaysDataType
  if (!Array.isArray(list)) return []
  return list.map((d) => {
    // spdisplays_metal4 のような値。Intel Mac では spdisplays_metal に入る
    const metal = /metal(\d+)/i.exec(
      String(d.spdisplays_mtlgpufamilysupport ?? d.spdisplays_metal ?? '')
    )?.[1]
    return {
      model: String(d.sppci_model ?? d._name ?? '不明'),
      cores: d.sppci_cores === undefined ? undefined : String(d.sppci_cores),
      metal: metal ? `Metal ${metal}` : undefined
    }
  })
}

/**
 * Windows の OS・GPU・ドライブの一覧を JSON で出す PowerShell。
 * ドライブの容量はここでは取らない（応答の無いネットワークドライブで待たされうるため、statfs で別に読む）
 */
export function windowsInfoScript(drives: boolean): string {
  return [
    "$ErrorActionPreference = 'SilentlyContinue'",
    '[Console]::OutputEncoding = [Text.Encoding]::UTF8',
    '$os = Get-CimInstance Win32_OperatingSystem',
    "$cv = Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion'",
    '@{',
    '  os = @{ caption = $os.Caption; build = $cv.CurrentBuild; ubr = $cv.UBR; displayVersion = $cv.DisplayVersion }',
    '  gpus = @(Get-CimInstance Win32_VideoController | ForEach-Object { @{ name = $_.Name; driver = $_.DriverVersion; pnp = $_.PNPDeviceID } })',
    '  memory = @(Get-CimInstance Win32_PhysicalMemory | ForEach-Object { @{ capacity = $_.Capacity; type = $_.SMBIOSMemoryType; speed = $_.ConfiguredClockSpeed } })',
    '  slots = (Get-CimInstance Win32_PhysicalMemoryArray | Measure-Object MemoryDevices -Sum).Sum',
    '  locale = & { $l = Get-WinSystemLocale; @{ name = $l.Name; codePage = $l.TextInfo.OEMCodePage } }',
    // 渡した順に1つずつ返す。バイナリは16進、複数行の文字列は改行でつなぐ
    `  registry = @(if ($env:${REGISTRY_ENV}) { ($env:${REGISTRY_ENV} | ConvertFrom-Json) | ForEach-Object {`,
    "    $v = (Get-ItemProperty -LiteralPath ('Registry::' + $_.key) -Name $_.value).($_.value)",
    "    if ($v -is [byte[]]) { $v = ($v | ForEach-Object { $_.ToString('x2') }) -join ' ' }",
    '    elseif ($v -is [array]) { $v = $v -join [char]10 }',
    '    @{ value = if ($null -eq $v) { $null } else { [string]$v } }',
    '  } })',
    drives
      ? '  drives = @(Get-CimInstance Win32_LogicalDisk -Property DeviceID,VolumeName,DriveType,ProviderName | ForEach-Object { @{ id = $_.DeviceID; label = $_.VolumeName; type = $_.DriveType; provider = $_.ProviderName } })'
      : '  drives = @()',
    '} | ConvertTo-Json -Depth 4 -Compress'
  ].join('\n')
}

const HIVES: Record<string, string> = {
  HKLM: 'HKEY_LOCAL_MACHINE',
  HKCU: 'HKEY_CURRENT_USER',
  HKCR: 'HKEY_CLASSES_ROOT',
  HKU: 'HKEY_USERS',
  HKCC: 'HKEY_CURRENT_CONFIG'
}

/** PowerShell に渡すときの既定値の名前 */
const DEFAULT_VALUE = '(default)'

/**
 * `HKLM\SOFTWARE\キー\値の名前` を、キー（HKEY_ で始まる正式な名前）と値の名前に分ける。
 * `\` で終われば既定値。ハイブが分からなければ undefined
 */
export function parseRegistryPath(p: string): { key: string; value: string } | undefined {
  const i = p.indexOf('\\')
  if (i < 0) return undefined
  const hive = p.slice(0, i).toUpperCase()
  const root = HIVES[hive] ?? (Object.values(HIVES).includes(hive) ? hive : undefined)
  const rest = p.slice(i + 1)
  if (!root || !rest) return undefined
  const j = rest.lastIndexOf('\\')
  return {
    key: j < 0 ? root : `${root}\\${rest.slice(0, j)}`,
    value: rest.slice(j + 1) || DEFAULT_VALUE
  }
}

/** 名前を書かなかったときの表示名。値の名前（既定値ならキーの最後の部分） */
export function registryDefaultName(p: string): string {
  const parsed = parseRegistryPath(p)
  if (!parsed) return p
  return parsed.value === DEFAULT_VALUE
    ? parsed.key.slice(parsed.key.lastIndexOf('\\') + 1)
    : parsed.value
}

/** windowsInfoScript にレジストリのパスを渡す環境変数（JSON。引用符や空白で崩れないように） */
export const REGISTRY_ENV = 'WORK_LAUNCHER_REGISTRY'

export interface WindowsInfo {
  os?: { name: string; version: string; build?: string }
  gpus: GpuInfo[]
  drives: Omit<DriveInfo, 'totalBytes' | 'freeBytes'>[]
  memoryModules?: MemoryModules
  systemLocale?: LanguageInfo['systemLocale']
  /** 渡したパスの順の値。無ければ undefined */
  registry: (string | undefined)[]
}

// Win32_PhysicalMemory の SMBIOSMemoryType
const MEMORY_TYPES: Record<number, string> = {
  20: 'DDR',
  21: 'DDR2',
  24: 'DDR3',
  26: 'DDR4',
  27: 'LPDDR',
  28: 'LPDDR2',
  29: 'LPDDR3',
  30: 'LPDDR4',
  34: 'DDR5',
  35: 'LPDDR5'
}

// Win32_LogicalDisk の DriveType。2 リムーバブル・3 固定・4 ネットワーク（5 の光学ドライブなどは出さない）
const DRIVE_TYPES = [2, 3, 4]

/** windowsInfoScript の出力を読む。読めなければ undefined */
export function parseWindowsInfo(json: string): WindowsInfo | undefined {
  let data: Record<string, unknown>
  try {
    data = JSON.parse(json)
  } catch {
    return undefined
  }
  const str = (v: unknown): string | undefined =>
    v === null || v === undefined || v === '' ? undefined : String(v)
  const list = (v: unknown): Record<string, unknown>[] =>
    Array.isArray(v) ? v : v && typeof v === 'object' ? [v as Record<string, unknown>] : []

  const o = (data.os ?? {}) as Record<string, unknown>
  const caption = str(o.caption)
  const build = str(o.build)
  const os = caption
    ? {
        name: caption,
        version: str(o.displayVersion) ?? '',
        build: build && (o.ubr !== undefined && o.ubr !== null ? `${build}.${o.ubr}` : build)
      }
    : undefined

  const allGpus = list(data.gpus)
  // 実体のある GPU（PCI）があれば、仮想のディスプレイアダプター（リモート用など）は除く
  const physical = allGpus.filter((g) => String(g.pnp ?? '').startsWith('PCI\\'))
  const gpus = (physical.length > 0 ? physical : allGpus).map((g): GpuInfo => {
    const driver = str(g.driver)
    const nvidia = /VEN_10DE/i.test(String(g.pnp ?? '')) || /^NVIDIA/i.test(String(g.name ?? ''))
    return {
      model: str(g.name) ?? '不明',
      driver,
      vendorDriver: nvidia && driver ? nvidiaDriverVersion(driver) : undefined
    }
  })

  const drives = list(data.drives)
    .filter((d) => DRIVE_TYPES.includes(Number(d.type)) && str(d.id))
    .map((d) => {
      const id = String(d.id)
      const network = Number(d.type) === 4
      const label = str(d.label) ?? (network ? str(d.provider) : undefined)
      return { name: label ? `${label} (${id})` : id, mountPoint: `${id}\\`, network }
    })

  const modules = list(data.memory).filter((m) => Number(m.capacity) > 0)
  const num = (v: unknown): number | undefined => (Number(v) > 0 ? Number(v) : undefined)
  const memoryModules: MemoryModules | undefined =
    modules.length > 0
      ? {
          sizes: modules.map((m) => Number(m.capacity)),
          type: MEMORY_TYPES[Number(modules[0].type)],
          speedMHz: num(modules[0].speed),
          slots: num(data.slots)
        }
      : undefined

  const l = (data.locale ?? {}) as Record<string, unknown>
  const localeName = str(l.name)
  const systemLocale = localeName ? { name: localeName, codePage: num(l.codePage) } : undefined

  const registry = list(data.registry).map((r) =>
    r.value === null || r.value === undefined ? undefined : String(r.value)
  )

  return { os, gpus, drives, memoryModules, systemLocale, registry }
}

/** NVIDIA のドライバーのバージョンを NVIDIA の表記にする（32.0.15.7216 → 572.16） */
export function nvidiaDriverVersion(driver: string): string | undefined {
  const parts = driver.split('.')
  if (parts.length !== 4 || !parts.every((p) => /^\d+$/.test(p))) return undefined
  const digits = (parts[2] + parts[3].padStart(4, '0')).slice(-5)
  if (digits.length < 5) return undefined
  return `${Number(digits.slice(0, 3))}.${digits.slice(3)}`
}

/** つながっていないアダプターに付くリンクローカル（169.254.x.x）は除く */
export function isUsefulIpv4(address: string): boolean {
  return !address.startsWith('169.254.')
}

export interface ToolCommand {
  command: string
  pattern?: string
}

/** Windows と Mac でだけ取れる組み込みのツール（ゲームのランチャー） */
export const GAME_LAUNCHER_TOOLS = ['steam', 'epic']

/** 組み込みのツールのうち、この OS では取れないもの */
export function isUnsupportedTool(name: string, platform: string): boolean {
  return GAME_LAUNCHER_TOOLS.includes(name) && platform !== 'win32' && platform !== 'darwin'
}

/** 設定に書く名前と表示名が違う組み込みのツール（製品名で出す） */
const BUILTIN_TOOL_LABELS: Record<string, string> = {
  steam: 'Steam',
  epic: 'Epic Games Launcher'
}

/** 表示名。command を書いたツールは設定の name のまま */
export function toolDisplayName(tool: { name: string; command?: string }): string {
  return (!tool.command && BUILTIN_TOOL_LABELS[tool.name]) || tool.name
}

/** cmd.exe から動かす PowerShell。script には二重引用符を使わない */
const powershell = (script: string): string =>
  `powershell -NoProfile -NonInteractive -Command "${script}"`

// Windows はインストール先をレジストリから探す。64bit 用（Win64・win64）を先に見る
// Steam は「Steam について」に出るクライアントのバージョン（manifest の version）
const STEAM_SCRIPT =
  "Get-ChildItem (Join-Path (Get-ItemProperty 'HKCU:\\Software\\Valve\\Steam').SteamPath 'package\\steam_client_win*.manifest') | Sort-Object Name -Descending | Select-Object -First 1 | Get-Content -TotalCount 5"
// Epic はキー名が GUID なので、アンインストール情報を表示名で探し、ランチャー本体のバージョンを読む
const EPIC_SCRIPT =
  "$l = Get-ItemProperty 'HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*','HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*' | Where-Object { $_.DisplayName -eq 'Epic Games Launcher' } | Select-Object -First 1; if ($l) { Get-Item (Join-Path $l.InstallLocation 'Launcher\\Portal\\Binaries\\Win*\\EpicGamesLauncher.exe') | Sort-Object FullName -Descending | Select-Object -First 1 | ForEach-Object { $_.VersionInfo.ProductVersion } }"

// Mac の Steam は初回起動でクライアントを Application Support に入れる。manifest の形は Windows と同じ
const MAC_STEAM_MANIFEST =
  '"$HOME/Library/Application Support/Steam/Steam.AppBundle/Steam/Contents/MacOS/package/steam_client_osx.manifest"'
// Mac の Epic はアプリの Info.plist のバージョン（アプリ内の表示と同じ）
const MAC_EPIC_PLIST = '"/Applications/Epic Games Launcher.app/Contents/Info"'

const STEAM_PATTERN = '"version"\\s+"(\\d+)"'

/** 組み込みのツールのバージョンの取り方。python は Mac では python3 を使う */
export function builtinToolCommand(name: string, platform: string): ToolCommand | undefined {
  if (isUnsupportedTool(name, platform)) return undefined
  const win = platform === 'win32'
  switch (name) {
    case 'steam':
      return {
        command: win ? powershell(STEAM_SCRIPT) : `head -n 5 ${MAC_STEAM_MANIFEST}`,
        pattern: STEAM_PATTERN
      }
    case 'epic':
      return {
        command: win
          ? powershell(EPIC_SCRIPT)
          : `defaults read ${MAC_EPIC_PLIST} CFBundleShortVersionString`
      }
    case 'git':
      return { command: 'git --version', pattern: 'git version (\\S+)' }
    case 'node':
      return { command: 'node --version', pattern: 'v?(\\S+)' }
    case 'npm':
      return { command: 'npm --version' }
    case 'python':
      // Windows は実行と同じく py を先に試す（python.exe は Store へ案内するスタブのことがある）
      return {
        command:
          platform === 'win32' ? 'py --version 2>nul || python --version' : 'python3 --version',
        pattern: 'Python (\\S+)'
      }
    case 'java':
      return { command: 'java -version', pattern: 'version "([^"]+)"' }
    case 'docker':
      return { command: 'docker --version', pattern: 'Docker version ([^,\\s]+)' }
    case 'dotnet':
      return { command: 'dotnet --version' }
    default:
      return undefined
  }
}

export function toolVersionLabel(tool: ToolInfo): string {
  return tool.version ?? (tool.unsupported ? 'この OS では取れません' : '未インストール')
}

/** バージョンを出力から抜き出す。pattern があれば1つ目のグループ、無ければ最初の空でない行 */
export function extractVersion(output: string, pattern?: string): string | undefined {
  if (pattern) {
    const m = new RegExp(pattern, 'm').exec(output)
    return m?.[1] ?? m?.[0]
  }
  return (
    output
      .split(/\r?\n/)
      .map((l) => l.trim())
      .find(Boolean) || undefined
  )
}

export function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let v = bytes
  let i = 0
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v >= 100 || i === 0 ? Math.round(v) : v.toFixed(1)} ${units[i]}`
}

export function osLabel(info: SystemInfo): string {
  const { name, version, build, arch } = info.os
  return `${name} ${version}${build ? ` (${build})` : ''} ${arch}`
}

/** モデル名の後ろに付ける括弧書き（コア数・Metal・ドライバーのバージョン）。無ければ undefined */
export function gpuDetail(gpu: GpuInfo): string | undefined {
  const parts = [
    gpu.cores && `${gpu.cores} コア`,
    gpu.metal,
    // GPU の行なので、Ver. だけでドライバーのバージョンと分かる
    gpu.driver && `Ver. ${gpu.vendorDriver ? `${gpu.vendorDriver} / ` : ''}${gpu.driver}`
  ]
  const extra = parts.filter(Boolean).join('・')
  return extra ? `（${extra}）` : undefined
}

export function gpuLabel(gpu: GpuInfo): string {
  return gpu.model + (gpuDetail(gpu) ?? '')
}

export function memoryLabel(memory: SystemInfo['memory']): string {
  const total = formatBytes(memory.totalBytes)
  return memory.usedBytes === undefined
    ? total
    : `${total}（使用中 ${formatBytes(memory.usedBytes)}）`
}

/** 内訳の容量。メモリは GB 単位で揃うことが多いので、割り切れれば小数を付けない */
function moduleSize(bytes: number): string {
  const gb = bytes / 1024 ** 3
  return Number.isInteger(gb) ? `${gb} GB` : formatBytes(bytes)
}

/** 例: 8 GB × 2・DDR4-2667・スロット 2/4 */
export function memoryModulesLabel(m: MemoryModules): string {
  const sizes = m.sizes.map(moduleSize)
  const capacity = sizes.every((s) => s === sizes[0])
    ? sizes.length > 1
      ? `${sizes[0]} × ${sizes.length}`
      : sizes[0]
    : sizes.join(' + ')
  const speed =
    m.type && m.speedMHz
      ? `${m.type}-${m.speedMHz}`
      : (m.type ?? (m.speedMHz ? `${m.speedMHz} MHz` : undefined))
  const slots = m.slots ? `スロット ${m.sizes.length}/${m.slots}` : undefined
  return [capacity, speed, slots].filter(Boolean).join('・')
}

/** 例: 表示 ja・地域 ja-JP・システム ja-JP（cp932） */
export function languageLabel(language: LanguageInfo): string {
  const { display, region, systemLocale: s } = language
  const parts = [`表示 ${display.join(', ') || '不明'}`, `地域 ${region}`]
  if (s) parts.push(`システム ${s.name}${s.codePage ? `（cp${s.codePage}）` : ''}`)
  return parts.join('・')
}

export interface InfoRow {
  label: string
  value: string
  /** 補足。画面では次の行に控えめに出す */
  sub?: string
  /** コピー用のテキストでは補足を value につなげる（既定は字下げした次の行） */
  subInline?: boolean
}

export interface InfoGroup {
  key: 'pc' | 'os' | 'hardware'
  title: string
  rows: InfoRow[]
}

/** システムの情報を見出しごとに分けた行。画面とコピー用のテキストで同じものを並べる */
export function systemGroups(info: SystemInfo): InfoGroup[] {
  const { language, memory } = info
  const row = (label: string, value: string): InfoRow => ({ label, value })
  return [
    {
      key: 'pc',
      title: 'PC',
      rows: [
        row('コンピュータ名', info.computerName),
        row('ユーザー名', info.userName),
        ...info.addresses.map((a) => row('IP', `${a.address}（${a.name}）`))
      ]
    },
    {
      key: 'os',
      title: 'OS',
      rows: [row('OS', osLabel(info)), row('言語', languageLabel(language))]
    },
    {
      key: 'hardware',
      title: 'ハードウェア',
      rows: [
        row('CPU', `${info.cpu.model}（${info.cpu.cores} コア）`),
        {
          label: 'メモリ',
          value: memoryLabel(memory),
          sub: memory.modules && memoryModulesLabel(memory.modules)
        },
        // 画面では長いモデル名と括弧書きを分けて出す。テキストは1行のまま
        ...info.gpus.map((g) => ({
          label: 'GPU',
          value: g.model,
          sub: gpuDetail(g),
          subInline: true
        }))
      ]
    }
  ]
}

/** コピー用のテキストの1行（補足があれば続ける） */
function rowText(r: InfoRow): string {
  const sub = r.sub === undefined ? '' : r.subInline ? r.sub : `\n  ${r.sub}`
  return `${r.label}: ${r.value}${sub}`
}

export function driveLabel(drive: DriveInfo): string {
  if (drive.totalBytes === undefined || drive.freeBytes === undefined) return '取得できません'
  return `空き ${formatBytes(drive.freeBytes)} / ${formatBytes(drive.totalBytes)}`
}

export type InfoSectionKey = InfoGroup['key'] | 'tools' | 'drives' | 'env' | 'registry'

/** 画面の枠1つ分のコピー用テキスト。lines が空の枠はコピーできない */
export interface InfoSection {
  key: InfoSectionKey
  title: string
  lines: string[]
}

/** 枠ごとのコピー用テキスト。画面の枠と同じ順に並べる */
export function infoSections(info: SystemInfo): InfoSection[] {
  return [
    ...systemGroups(info).map((g) => ({
      key: g.key,
      title: g.title,
      lines: g.rows.map(rowText)
    })),
    {
      key: 'tools',
      title: 'ツール',
      lines: info.tools.map((t) => `${t.name}: ${toolVersionLabel(t)}`)
    },
    {
      key: 'drives',
      title: 'ドライブ',
      lines: info.drives.map(
        (d) => `${d.name}${d.network ? '（ネットワーク）' : ''}: ${driveLabel(d)}`
      )
    },
    {
      key: 'env',
      title: '環境変数',
      lines: info.env.map((e) => `${e.name}=${e.value ?? '（未設定）'}`)
    },
    {
      key: 'registry',
      title: 'レジストリ',
      lines: (info.registry ?? []).map((r) => `${r.name}=${r.value ?? '（未設定）'}`)
    }
  ]
}

export function sectionText(section: InfoSection): string {
  return [`[${section.title}]`, ...section.lines].join('\n') + '\n'
}

/** 問い合わせなどに貼り付けるテキスト。枠ごとのテキストをつなげる */
export function infoText(info: SystemInfo): string {
  return [
    `WorkLauncher: ${info.app.version}（Electron ${info.app.electron}）\n`,
    ...infoSections(info)
      .filter((s) => s.lines.length > 0)
      .map(sectionText)
  ].join('\n')
}
