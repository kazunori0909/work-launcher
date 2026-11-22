// Info のツールのバージョンを、アプリを起動せずに同じ判定で取る（/check-tools スキルから使う）
//
//   node scripts/check-tools.mjs [名前...] [--json] [--cwd <フォルダ>]
//
// 名前を省くと組み込みのツールをすべて見る。PATH はアプリを新しく起動したときと同じにする
// （Mac はログインシェルの PATH、Windows はレジストリの PATH）

import { execFileSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runnerImport } from 'vite'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const load = async (file) =>
  (await runnerImport(path.join(root, file), { configFile: false, root, logLevel: 'error' })).module

const args = process.argv.slice(2)
const json = args.includes('--json')
const cwdAt = args.indexOf('--cwd')
const cwd = cwdAt >= 0 ? path.resolve(args[cwdAt + 1]) : os.tmpdir()
const names = args.filter((a, i) => !a.startsWith('--') && (cwdAt < 0 || i !== cwdAt + 1))

/** インストーラが書き換えるのはレジストリの PATH。いまのシェルの PATH は古いまま */
function windowsRegistryPath() {
  const script =
    "[Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [Environment]::GetEnvironmentVariable('Path','User')"
  const raw = execFileSync(
    'powershell.exe',
    ['-NoProfile', '-NonInteractive', '-Command', script],
    {
      encoding: 'utf8'
    }
  ).trim()
  // %SystemRoot% などを展開する
  return raw.replace(/%([^%]+)%/g, (m, name) => process.env[name] ?? m)
}

if (process.platform === 'win32') process.env.Path = process.env.PATH = windowsRegistryPath()
if (process.platform === 'darwin') {
  const { loadShellPath, shellPathReady } = await load('src/main/shellPath.ts')
  loadShellPath()
  await shellPathReady()
}

const { BUILTIN_TOOLS, builtinToolCommand } = await load('src/core/builtinTools.ts')
const { toolInfo } = await load('src/main/toolVersion.ts')

/** コマンドがどこに見つかったか（判定の手がかりに出す） */
function resolved(command) {
  const first = command.split(/\s+/)[0]
  try {
    const out =
      process.platform === 'win32'
        ? execFileSync('where', [first], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
        : execFileSync('/bin/sh', ['-c', `command -v ${first}`], { encoding: 'utf8' })
    return out.split(/\r?\n/)[0].trim() || undefined
  } catch {
    return undefined
  }
}

const targets = names.length ? names : BUILTIN_TOOLS.map((t) => t.name)
const results = await Promise.all(
  targets.map(async (name) => {
    const info = await toolInfo({ name }, cwd)
    const cmd = builtinToolCommand(name, process.platform)
    const status = info.unsupported
      ? 'unsupported'
      : info.version
        ? 'installed'
        : info.mismatch
          ? 'mismatch'
          : 'missing'
    return { name, status, version: info.version, path: cmd && resolved(cmd.command) }
  })
)

if (json) {
  console.log(JSON.stringify({ platform: process.platform, results }, null, 2))
} else {
  const label = {
    installed: '',
    missing: '未インストール',
    mismatch: 'pattern が一致しません',
    unsupported: 'この OS では取れません'
  }
  for (const r of results) {
    console.log(`${r.name.padEnd(8)} ${(r.version ?? label[r.status]).padEnd(24)} ${r.path ?? ''}`)
  }
}
