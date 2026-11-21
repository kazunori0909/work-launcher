import { statfs } from 'node:fs/promises'
import os from 'node:os'
import { app } from 'electron'
import { handle } from './ipc'
import {
  isUsefulIpv4,
  parseDisplays,
  parseKeyValues,
  parseImageMountPoints,
  parseMount,
  parseRegistryPath,
  parseWindowsInfo,
  REGISTRY_ENV,
  selectDrives,
  usedMemoryFromVmStat,
  windowsInfoScript
} from '../core/info'
import type { DriveInfo, SystemInfo, WindowsInfo } from '../core/info'
import type { InfoConfig, ProjectView } from '../core/types'
import type { ViewOf } from './project'
import { shellPathReady } from './shellPath'
import { run } from './run'
import { toolInfo } from './toolVersion'
import { t } from '../core/i18n'

/** 応答の無いネットワークドライブで待ち続けないよう、時間を区切る */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([p, new Promise<undefined>((r) => setTimeout(() => r(undefined), ms))])
}

async function macOs(): Promise<SystemInfo['os']> {
  const v = parseKeyValues((await run('sw_vers', [])).text)
  return {
    name: v.ProductName ?? 'macOS',
    version: v.ProductVersion ?? os.release(),
    build: v.BuildVersion,
    arch: os.arch()
  }
}

async function macComputerName(): Promise<string> {
  const r = await run('scutil', ['--get', 'ComputerName'])
  return (r.ok && r.text.trim()) || os.hostname()
}

async function macDrives(): Promise<DriveInfo[]> {
  const [mount, images] = await Promise.all([run('mount', []), run('hdiutil', ['info'])])
  return withSizes(selectDrives(parseMount(mount.text), parseImageMountPoints(images.text)))
}

function withSizes(drives: Omit<DriveInfo, 'totalBytes' | 'freeBytes'>[]): Promise<DriveInfo[]> {
  return Promise.all(
    drives.map(async (d) => {
      const s = await withTimeout(
        statfs(d.mountPoint).catch(() => undefined),
        3000
      )
      // APFS は同じ入れ物の中で空きを分け合うため、使用量は 全体 - 空き で見る
      return s ? { ...d, totalBytes: s.blocks * s.bsize, freeBytes: s.bavail * s.bsize } : d
    })
  )
}

function addresses(): SystemInfo['addresses'] {
  return Object.entries(os.networkInterfaces()).flatMap(([name, list]) =>
    (list ?? [])
      .filter((a) => a.family === 'IPv4' && !a.internal && isUsefulIpv4(a.address))
      .map((a) => ({ name, address: a.address }))
  )
}

async function windowsInfo(
  drives: boolean,
  registry: InfoConfig['registry']
): Promise<WindowsInfo | undefined> {
  const r = await run(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', windowsInfoScript(drives)],
    20000,
    { [REGISTRY_ENV]: JSON.stringify(registry.map((e) => parseRegistryPath(e.path))) }
  )
  return r.ok ? parseWindowsInfo(r.text) : undefined
}

/** OS ごとに取り方が違う項目 */
type PlatformInfo = Pick<SystemInfo, 'os' | 'computerName' | 'gpus' | 'drives' | 'problems'> & {
  usedBytes?: number
  memoryModules?: SystemInfo['memory']['modules']
  systemLocale?: SystemInfo['language']['systemLocale']
  registry?: SystemInfo['registry']
}

async function macPlatformInfo(drives: boolean): Promise<PlatformInfo> {
  const [osInfo, computerName, usedBytes, gpus, driveList] = await Promise.all([
    macOs(),
    macComputerName(),
    run('vm_stat', []).then((r) => usedMemoryFromVmStat(r.text)),
    run('system_profiler', ['SPDisplaysDataType', '-json']).then((r) => parseDisplays(r.text)),
    drives ? macDrives() : Promise.resolve([])
  ])
  return { os: osInfo, computerName, usedBytes, gpus, drives: driveList, problems: [] }
}

async function windowsPlatformInfo(config: InfoConfig): Promise<PlatformInfo> {
  const w = await windowsInfo(config.drives !== false, config.registry)
  return {
    registry: config.registry.map((r, i) => ({ ...r, value: w?.registry[i] })),
    os: { ...(w?.os ?? { name: 'Windows', version: os.release() }), arch: os.arch() },
    computerName: os.hostname(),
    usedBytes: os.totalmem() - os.freemem(),
    memoryModules: w?.memoryModules,
    systemLocale: w?.systemLocale,
    gpus: w?.gpus ?? [],
    drives: w ? await withSizes(w.drives) : [],
    problems: w ? [] : [t().info.psFailed]
  }
}

function otherPlatformInfo(): PlatformInfo {
  return {
    os: { name: os.type(), version: os.release(), arch: os.arch() },
    computerName: os.hostname(),
    gpus: [],
    drives: [],
    problems: [t().info.linuxPartial]
  }
}

export async function collectInfo(view: ProjectView | undefined): Promise<SystemInfo> {
  await shellPathReady()
  const config = view?.project?.info ?? { env: [], tools: [], registry: [] }

  const cpus = os.cpus()
  const [platform, tools] = await Promise.all([
    process.platform === 'darwin'
      ? macPlatformInfo(config.drives !== false)
      : process.platform === 'win32'
        ? windowsPlatformInfo(config)
        : Promise.resolve(otherPlatformInfo()),
    Promise.all(config.tools.map((t) => toolInfo(t, view?.launcherDir)))
  ])

  return {
    os: platform.os,
    // 表示言語は PowerShell の Get-UICulture が実際と違う値を返すことがあるため、Electron から取る
    language: {
      display: app.getPreferredSystemLanguages(),
      region: app.getSystemLocale(),
      systemLocale: platform.systemLocale
    },
    computerName: platform.computerName,
    userName: os.userInfo().username,
    cpu: { model: cpus[0]?.model.trim() ?? t().unknown, cores: cpus.length },
    memory: {
      totalBytes: os.totalmem(),
      usedBytes: platform.usedBytes,
      modules: platform.memoryModules
    },
    gpus: platform.gpus,
    drives: platform.drives,
    addresses: addresses(),
    env: config.env.map((name) => ({ name, value: process.env[name] })),
    registry: platform.registry,
    tools,
    app: { version: app.getVersion(), electron: process.versions.electron },
    problems: platform.problems
  }
}

export function registerInfoHandlers(viewOf: ViewOf): void {
  handle('getInfo', (e) => collectInfo(viewOf(e.sender)))
}
