import { describe, expect, it } from 'vitest'
import {
  extractVersion,
  formatBytes,
  gpuLabel,
  infoSections,
  infoText,
  isUsefulIpv4,
  languageLabel,
  memoryModulesLabel,
  nvidiaDriverVersion,
  parseDisplays,
  parseKeyValues,
  parseImageMountPoints,
  parseMount,
  parseRegistryPath,
  parseWindowsInfo,
  registryDefaultName,
  sectionText,
  selectDrives,
  toolResult,
  toolVersionLabel,
  usedMemoryFromVmStat
} from './info'
import type { SystemInfo } from './info'
import { builtinToolCommand, isUnsupportedTool, toolDisplayName } from './builtinTools'

it('parseKeyValues: sw_vers の出力', () => {
  const text = 'ProductName:\t\tmacOS\nProductVersion:\t\t26.6.2\nBuildVersion:\t\t25G83\n'
  expect(parseKeyValues(text)).toEqual({
    ProductName: 'macOS',
    ProductVersion: '26.6.2',
    BuildVersion: '25G83'
  })
})

it('usedMemoryFromVmStat: アクティブ + 固定 + 圧縮で占有', () => {
  const text = `Mach Virtual Memory Statistics: (page size of 16384 bytes)
Pages free:                                     4009.
Pages active:                                  100.
Pages inactive:                                85780.
Pages wired down:                             20.
Pages stored in compressor:                   740074.
Pages occupied by compressor:                 3.
`
  expect(usedMemoryFromVmStat(text)).toBe(123 * 16384)
  expect(usedMemoryFromVmStat('壊れた出力')).toBeUndefined()
})

describe('mount と selectDrives', () => {
  const text = `/dev/disk3s1s1 on / (apfs, sealed, local, read-only, journaled)
devfs on /dev (devfs, local, nobrowse)
/dev/disk3s6 on /System/Volumes/VM (apfs, local, noexec, journaled, noatime, nobrowse)
/dev/disk3s5 on /System/Volumes/Data (apfs, local, journaled, nobrowse, protect)
/dev/disk5s1 on /Volumes/USB メモリ (msdos, local, nodev, nosuid, noowners)
//user@server/share on /Volumes/share (smbfs, nodev, nosuid, mounted by user)
/dev/disk7s1 on /Volumes/隠し (apfs, local, nobrowse)`

  it('mount の行を読む', () => {
    expect(parseMount(text)[4]).toEqual({
      device: '/dev/disk5s1',
      mountPoint: '/Volumes/USB メモリ',
      type: 'msdos',
      flags: ['local', 'nodev', 'nosuid', 'noowners']
    })
  })

  it('起動ディスクと /Volumes の下だけ。nobrowse は除き、smbfs はネットワーク', () => {
    expect(selectDrives(parseMount(text))).toEqual([
      { name: '起動ディスク', mountPoint: '/', network: false },
      { name: 'USB メモリ', mountPoint: '/Volumes/USB メモリ', network: false },
      { name: 'share', mountPoint: '/Volumes/share', network: true }
    ])
  })

  it('ディスクイメージ（dmg）は除く', () => {
    const hdiutil = `================================================
framework       : 683.160.3
image-path      : /Users/user/Downloads/app.dmg
image-type      : read-only disk image
/dev/disk5	GUID_partition_scheme	
/dev/disk5s1	48465300-0000-11AA-AA11-00306543ECAC	/Volumes/USB メモリ`
    expect(parseImageMountPoints(hdiutil)).toEqual(['/Volumes/USB メモリ'])
    expect(selectDrives(parseMount(text), parseImageMountPoints(hdiutil))).toEqual([
      { name: '起動ディスク', mountPoint: '/', network: false },
      { name: 'share', mountPoint: '/Volumes/share', network: true }
    ])
  })
})

describe('parseDisplays', () => {
  it('Apple シリコン: モデル・コア数・Metal', () => {
    const json = JSON.stringify({
      SPDisplaysDataType: [
        {
          _name: 'Apple M3 Pro',
          sppci_model: 'Apple M3 Pro',
          sppci_cores: '18',
          spdisplays_mtlgpufamilysupport: 'spdisplays_metal4'
        }
      ]
    })
    expect(parseDisplays(json)).toEqual([{ model: 'Apple M3 Pro', cores: '18', metal: 'Metal 4' }])
  })

  it('Intel Mac は spdisplays_metal、壊れた JSON は空', () => {
    const json = JSON.stringify({
      SPDisplaysDataType: [
        { sppci_model: 'Intel Iris Plus', spdisplays_metal: 'spdisplays_metal3' }
      ]
    })
    expect(parseDisplays(json)).toEqual([
      { model: 'Intel Iris Plus', cores: undefined, metal: 'Metal 3' }
    ])
    expect(parseDisplays('{')).toEqual([])
  })
})

describe('ツールのバージョン', () => {
  it('組み込みの取り方で抜き出す', () => {
    const v = (name: string, out: string, platform = 'darwin'): string | undefined =>
      extractVersion(out, builtinToolCommand(name, platform)!.pattern)
    expect(v('git', 'git version 2.50.1 (Apple Git-155)')).toBe('2.50.1')
    expect(v('node', 'v24.11.0\n')).toBe('24.11.0')
    expect(v('npm', '11.6.2\n')).toBe('11.6.2')
    expect(v('python', 'Python 3.9.6')).toBe('3.9.6')
    expect(v('java', 'openjdk version "21.0.5" 2024-10-15\nOpenJDK Runtime')).toBe('21.0.5')
    expect(v('docker', 'Docker version 29.3.0, build 5927d80c76')).toBe('29.3.0')
  })

  it('Mac の python は python3、Windows は py を先に試し、無ければ python', () => {
    expect(builtinToolCommand('python', 'darwin')?.command).toBe('python3 --version')
    expect(builtinToolCommand('python', 'win32')?.command).toBe(
      'py --version 2>nul || python --version'
    )
    expect(builtinToolCommand('maven', 'darwin')).toBeUndefined()
  })

  it('steam・epic は Windows と Mac。Steam は manifest の version を抜き出す', () => {
    const manifest = '"win64"\r\n{\r\n\t"version"\t\t"1788291500"\r\n\t"ostype"\t\t"win10"\r\n'
    expect(extractVersion(manifest, builtinToolCommand('steam', 'win32')!.pattern)).toBe(
      '1788291500'
    )
    expect(extractVersion('20.3.8-0+UE5\r\n', builtinToolCommand('epic', 'win32')!.pattern)).toBe(
      '20.3.8-0+UE5'
    )
    // cmd.exe の引数を二重引用符で囲むため、中に二重引用符を使わない
    for (const name of ['steam', 'epic']) {
      const command = builtinToolCommand(name, 'win32')!.command
      expect(command.slice(command.indexOf('"') + 1, -1)).not.toContain('"')
      expect(builtinToolCommand(name, 'linux')).toBeUndefined()
      expect(isUnsupportedTool(name, 'linux')).toBe(true)
      expect(isUnsupportedTool(name, 'darwin')).toBe(false)
    }
  })

  it('Mac の steam は osx の manifest、epic は Info.plist のバージョン', () => {
    const steam = builtinToolCommand('steam', 'darwin')!
    expect(steam.command).toContain('steam_client_osx.manifest')
    const manifest = '"osx"\n{\n\t"version"\t\t"1794536281"\n\t"ostype"\t\t"macos1015"\n'
    expect(extractVersion(manifest, steam.pattern)).toBe('1794536281')
    const epic = builtinToolCommand('epic', 'darwin')!
    expect(epic.command).toContain('CFBundleShortVersionString')
    expect(extractVersion('0.117.0\n', epic.pattern)).toBe('0.117.0')
  })

  it('toolDisplayName: 組み込みの steam・epic は製品名で出す（上書きしても同じ）', () => {
    expect(toolDisplayName({ name: 'epic' })).toBe('Epic Games Launcher')
    expect(toolDisplayName({ name: 'steam' })).toBe('Steam')
    expect(toolDisplayName({ name: 'git' })).toBe('git')
    expect(toolDisplayName({ name: 'Maven' })).toBe('Maven')
  })

  it('toolVersionLabel: 取れない理由を出し分ける', () => {
    expect(toolVersionLabel({ name: 'git', version: '2.50.1' })).toBe('2.50.1')
    expect(toolVersionLabel({ name: 'git' })).toBe('未インストール')
    expect(toolVersionLabel({ name: 'steam', unsupported: true })).toBe('この OS では取れません')
    expect(toolVersionLabel({ name: 'git', mismatch: true })).toBe('pattern が一致しません')
  })

  it('toolResult: 出力はあるのに pattern に当たらなければ mismatch、出力が空や失敗なら未インストール', () => {
    const out = 'git version 2.50.0.windows.2\r\n'
    expect(toolResult(true, out, 'git version (\\d+)')).toEqual({ version: '2' })
    expect(toolResult(true, out, 'git version(\\d+)')).toEqual({ mismatch: true })
    expect(toolResult(true, '  \r\n', 'v(\\d+)')).toEqual({})
    expect(toolResult(false, out, 'git version(\\d+)')).toEqual({})
    expect(toolResult(true, '11.6.2\n')).toEqual({ version: '11.6.2' })
  })

  it('pattern が無ければ最初の空でない行、当たらなければ undefined', () => {
    expect(extractVersion('\n  Apache Maven 3.9.9\nMaven home')).toBe('Apache Maven 3.9.9')
    expect(extractVersion('nothing', 'v(\\d+)')).toBeUndefined()
    expect(extractVersion('')).toBeUndefined()
  })
})

it('formatBytes', () => {
  expect(formatBytes(512)).toBe('512 B')
  expect(formatBytes(1536)).toBe('1.5 KB')
  expect(formatBytes(16 * 1024 ** 3)).toBe('16.0 GB')
  expect(formatBytes(245 * 1024 ** 3)).toBe('245 GB')
})

it('infoText: 貼り付け用のテキスト', () => {
  const info: SystemInfo = {
    os: { name: 'macOS', version: '26.6.2', build: '25G83', arch: 'arm64' },
    language: { display: ['ja-JP', 'en-US'], region: 'ja-JP' },
    computerName: 'my-mac',
    userName: 'user',
    cpu: { model: 'Apple M3 Pro', cores: 12 },
    memory: {
      totalBytes: 18 * 1024 ** 3,
      usedBytes: 9 * 1024 ** 3,
      modules: { sizes: [8 * 1024 ** 3, 8 * 1024 ** 3], type: 'DDR4', speedMHz: 2667, slots: 4 }
    },
    gpus: [{ model: 'Apple M3 Pro', cores: '18', metal: 'Metal 4' }],
    drives: [{ name: 'share', mountPoint: '/Volumes/share', network: true }],
    addresses: [{ name: 'en0', address: '192.0.2.10' }],
    env: [{ name: 'JAVA_HOME' }],
    registry: [
      { name: 'LongPathsEnabled', path: 'HKLM\\X\\LongPathsEnabled', value: '1' },
      { name: 'JDK', path: 'HKLM\\Y\\CurrentVersion' }
    ],
    tools: [{ name: 'git', version: '2.50.1' }, { name: 'java' }],
    app: { version: '1.0.0', electron: '45.3.2' },
    problems: []
  }
  expect(infoText(info)).toBe(`WorkLauncher: 1.0.0（Electron 45.3.2）

[PC]
コンピュータ名: my-mac
ユーザー名: user
IP: 192.0.2.10（en0）

[OS]
OS: macOS 26.6.2 (25G83) arm64
言語: 表示 ja-JP, en-US・地域 ja-JP

[ハードウェア]
CPU: Apple M3 Pro（12 コア）
メモリ: 18.0 GB（使用中 9.0 GB）
  8 GB × 2・DDR4-2667・スロット 2/4
GPU: Apple M3 Pro（18 コア・Metal 4）

[ツール]
git: 2.50.1
java: 未インストール

[ドライブ]
share（ネットワーク）: 取得できません

[環境変数]
JAVA_HOME=（未設定）

[レジストリ]
LongPathsEnabled=1
JDK=（未設定）
`)

  // 全体のテキストは、枠ごとのテキストをつなげたもの
  const sections = infoSections(info)
  expect(sections.map((s) => s.key)).toEqual([
    'pc',
    'os',
    'hardware',
    'tools',
    'drives',
    'env',
    'registry'
  ])
  expect(sectionText(sections[3])).toBe('[ツール]\ngit: 2.50.1\njava: 未インストール\n')
  for (const s of sections) expect(infoText(info)).toContain(sectionText(s))
})

it('infoText: 中身の無い枠は入れない', () => {
  const info: SystemInfo = {
    os: { name: 'Windows', version: '25H2', arch: 'x64' },
    language: { display: ['ja'], region: 'ja-JP' },
    computerName: 'pc',
    userName: 'user',
    cpu: { model: 'CPU', cores: 4 },
    memory: { totalBytes: 8 * 1024 ** 3 },
    gpus: [],
    drives: [],
    addresses: [],
    env: [],
    tools: [],
    app: { version: '1.0.0', electron: '45.3.2' },
    problems: []
  }
  expect(infoText(info)).not.toMatch(/\[(ツール|ドライブ|環境変数|レジストリ)\]/)
  expect(infoSections(info).find((s) => s.key === 'registry')?.lines).toEqual([])
})

describe('Windows', () => {
  it('parseWindowsInfo: OS・GPU・ドライブを読む', () => {
    const json = JSON.stringify({
      os: {
        caption: 'Microsoft Windows 11 Home',
        build: '26200',
        ubr: 9974,
        displayVersion: '25H2'
      },
      gpus: [
        { name: 'NVIDIA GeForce RTX 2060', driver: '32.0.15.7216', pnp: 'PCI\\VEN_10DE&DEV_1F15' },
        { name: 'Intel(R) UHD Graphics', driver: '31.0.101.1999', pnp: 'PCI\\VEN_8086&DEV_9BC4' },
        { name: 'Remote Display Adapter', driver: '10.0.1', pnp: 'SWD\\REMOTEDISPLAY' }
      ],
      drives: [
        { id: 'C:', label: '', type: 3, provider: null },
        { id: 'D:', label: 'データ', type: 3, provider: null },
        { id: 'E:', label: null, type: 5, provider: null },
        { id: 'Z:', label: null, type: 4, provider: '\\\\server\\share' }
      ]
    })
    expect(parseWindowsInfo(json)).toMatchObject({
      os: { name: 'Microsoft Windows 11 Home', version: '25H2', build: '26200.9974' },
      gpus: [
        { model: 'NVIDIA GeForce RTX 2060', driver: '32.0.15.7216', vendorDriver: '572.16' },
        { model: 'Intel(R) UHD Graphics', driver: '31.0.101.1999', vendorDriver: undefined }
      ],
      drives: [
        { name: 'C:', mountPoint: 'C:\\', network: false },
        { name: 'データ (D:)', mountPoint: 'D:\\', network: false },
        { name: '\\\\server\\share (Z:)', mountPoint: 'Z:\\', network: true }
      ]
    })
  })

  it('parseWindowsInfo: メモリの内訳とシステムロケール', () => {
    const json = JSON.stringify({
      memory: [
        { capacity: 8589934592, type: 26, speed: 2667 },
        { capacity: 4294967296, type: 26, speed: 2667 }
      ],
      slots: 4,
      locale: { name: 'ja-JP', codePage: 932 }
    })
    expect(parseWindowsInfo(json)).toMatchObject({
      memoryModules: { sizes: [8589934592, 4294967296], type: 'DDR4', speedMHz: 2667, slots: 4 },
      systemLocale: { name: 'ja-JP', codePage: 932 }
    })
    // 仮想マシンなどで取れないときは出さない
    expect(parseWindowsInfo(JSON.stringify({ memory: [], locale: {} }))).toMatchObject({
      memoryModules: undefined,
      systemLocale: undefined
    })
  })

  it('memoryModulesLabel: 同じ容量はまとめ、違えば + で並べる', () => {
    const gb = 1024 ** 3
    expect(memoryModulesLabel({ sizes: [8 * gb, 4 * gb], type: 'DDR4', speedMHz: 2667 })).toBe(
      '8 GB + 4 GB・DDR4-2667'
    )
    expect(memoryModulesLabel({ sizes: [16 * gb], speedMHz: 3200, slots: 2 })).toBe(
      '16 GB・3200 MHz・スロット 1/2'
    )
  })

  it('parseRegistryPath: ハイブを正式な名前にし、値の名前を分ける', () => {
    expect(parseRegistryPath('HKLM\\SOFTWARE\\JavaSoft\\JDK\\CurrentVersion')).toEqual({
      key: 'HKEY_LOCAL_MACHINE\\SOFTWARE\\JavaSoft\\JDK',
      value: 'CurrentVersion'
    })
    expect(parseRegistryPath('hkey_current_user\\Software\\Example\\')).toEqual({
      key: 'HKEY_CURRENT_USER\\Software\\Example',
      value: '(default)'
    })
    expect(parseRegistryPath('HKCU\\Value')).toEqual({ key: 'HKEY_CURRENT_USER', value: 'Value' })
    expect(parseRegistryPath('SOFTWARE\\Example')).toBeUndefined()
    expect(parseRegistryPath('HKLM\\')).toBeUndefined()
  })

  it('registryDefaultName: 値の名前。既定値はキーの最後の部分', () => {
    expect(registryDefaultName('HKLM\\SOFTWARE\\JavaSoft\\JDK\\CurrentVersion')).toBe(
      'CurrentVersion'
    )
    expect(registryDefaultName('HKCU\\Software\\Example\\')).toBe('Example')
  })

  it('parseWindowsInfo: レジストリは渡した順の値。無ければ undefined', () => {
    const json = JSON.stringify({ registry: [{ value: '1' }, { value: null }, { value: '' }] })
    expect(parseWindowsInfo(json)?.registry).toEqual(['1', undefined, ''])
  })

  it('languageLabel: 表示・地域・システムを1行に並べる', () => {
    const systemLocale = { name: 'ja-JP', codePage: 932 }
    expect(languageLabel({ display: ['ja'], region: 'ja-JP', systemLocale })).toBe(
      '表示 ja・地域 ja-JP・システム ja-JP（cp932）'
    )
    expect(languageLabel({ display: [], region: 'ja-JP', systemLocale: { name: 'ja-JP' } })).toBe(
      '表示 不明・地域 ja-JP・システム ja-JP'
    )
  })

  it('parseWindowsInfo: 1件だけのオブジェクトも読み、壊れた JSON は undefined', () => {
    const r = parseWindowsInfo(JSON.stringify({ os: {}, gpus: { name: 'GPU', pnp: 'ROOT\\X' } }))
    expect(r).toMatchObject({ os: undefined, gpus: [{ model: 'GPU' }], drives: [] })
    expect(parseWindowsInfo('oops')).toBeUndefined()
  })

  it('nvidiaDriverVersion: 下5桁を NVIDIA の表記にする', () => {
    expect(nvidiaDriverVersion('32.0.15.7216')).toBe('572.16')
    expect(nvidiaDriverVersion('31.0.15.5222')).toBe('552.22')
    expect(nvidiaDriverVersion('30.0.14.958')).toBe('409.58')
    expect(nvidiaDriverVersion('不明')).toBeUndefined()
  })

  it('gpuLabel: NVIDIA は両方の表記を並べる', () => {
    expect(gpuLabel({ model: 'G', driver: '32.0.15.7216', vendorDriver: '572.16' })).toBe(
      'G（Ver. 572.16 / 32.0.15.7216）'
    )
    expect(gpuLabel({ model: 'G', driver: '31.0.101.1999' })).toBe('G（Ver. 31.0.101.1999）')
  })
})

it('isUsefulIpv4: リンクローカルは除く', () => {
  expect(isUsefulIpv4('192.0.2.10')).toBe(true)
  expect(isUsefulIpv4('169.254.1.2')).toBe(false)
})
