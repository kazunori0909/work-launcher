import { spawn } from 'node:child_process'
import type { ChildProcess } from 'node:child_process'
import { existsSync, statSync } from 'node:fs'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import iconv from 'iconv-lite'
import { execKindFor } from './items'
import type { ExecKind, Item, Page, Project } from './types'
import { effectiveCwd, expandVariables, resolveWorkDir } from './variables'
import { t } from './i18n'

export interface RunRequest {
  kind: ExecKind
  script: string
  cwd: string
  env: NodeJS.ProcessEnv
  encoding: string
  platform: NodeJS.Platform
  /** 実行前に知らせること（未定義の環境変数など） */
  warnings: string[]
}

export type Stream = 'stdout' | 'stderr'

export interface RunResult {
  code: number | null
  signal: NodeJS.Signals | null
  /** 終了コードだけでは分かりにくいときの説明 */
  error?: string
}

export interface RunHandle {
  stop(): void
  done: Promise<RunResult>
}

/** 項目と設定から、実行に要る値を組み立てる。実行できなければ理由を返す */
export function prepareRun(
  project: Project,
  page: Page,
  item: Item,
  launcherDir: string,
  env: NodeJS.ProcessEnv,
  platform: NodeJS.Platform = process.platform,
  /** select の値（resolveSelections で決めたもの） */
  select: Record<string, string> = {}
): RunRequest | string {
  if (item.kind !== 'exec') return t().run.notExec
  const kind = execKindFor(item.scripts, platform)
  if (!kind) return t().run.notOnThisOs
  return prepareScript(
    {
      kind,
      script: item.scripts[kind]!,
      cwd: effectiveCwd(project, page, item),
      env: item.env,
      encoding: item.encoding
    },
    { launcherDir, env, platform, select }
  )
}

/** 動かすスクリプト（変数は置き換える前） */
export interface ScriptSpec {
  kind: ExecKind
  script: string
  cwd?: string
  env?: Record<string, string>
  encoding?: string
}

/** スクリプトから、実行に要る値を組み立てる。実行できなければ理由を返す */
export function prepareScript(
  spec: ScriptSpec,
  base: {
    launcherDir: string
    env: NodeJS.ProcessEnv
    platform?: NodeJS.Platform
    select?: Record<string, string>
    /** spec.cwd が無いときの作業フォルダ（絶対パス）。無ければ launcherDir */
    defaultDir?: string
  }
): RunRequest | string {
  const { launcherDir, env, platform = process.platform, select = {} } = base
  const { kind } = spec
  if (execKindFor({ [kind]: spec.script }, platform) !== kind) return t().run.notOnThisOs

  const warnings: string[] = []
  const warnMissing = (names: string[]): void => {
    for (const name of names) warnings.push(t().run.envMissing(name))
  }

  let cwd = base.defaultDir ?? launcherDir
  if (spec.cwd !== undefined || base.defaultDir === undefined) {
    const work = resolveWorkDir(spec.cwd, launcherDir, env, platform)
    warnMissing(work.missingEnv)
    cwd = work.dir
  }
  if (!isDirectory(cwd)) return t().run.noWorkDir(cwd)

  const ctx = { launcherDir, workDir: cwd, env, select }
  const expand = (text: string): string => {
    const r = expandVariables(text, ctx)
    warnMissing(r.missingEnv)
    for (const name of r.missingSelect) warnings.push(t().run.selectMissing(name))
    return r.value
  }

  const extra = Object.fromEntries(Object.entries(spec.env ?? {}).map(([k, v]) => [k, expand(v)]))
  return {
    kind,
    script: expand(spec.script),
    cwd,
    // Python はパイプへの出力を OS の文字コード（日本語の Windows なら cp932）で出すため、
    // コンソールと同じ UTF-8 にする。利用者や項目の env で決めていればそちらを使う
    env: { ...(kind === 'python' ? { PYTHONIOENCODING: 'utf-8' } : {}), ...env, ...extra },
    encoding: spec.encoding ?? (kind === 'bat' ? 'cp932' : 'utf-8'),
    platform,
    warnings: [...new Set(warnings)]
  }
}

function isDirectory(p: string): boolean {
  try {
    return statSync(p).isDirectory()
  } catch {
    return false
  }
}

const EXT: Record<ExecKind, string> = { bat: '.bat', sh: '.sh', powershell: '.ps1', python: '.py' }

/**
 * Windows で sh を動かす Git Bash の候補。PATH の bash は WSL のことがあるため使わず、
 * 標準のインストール先と、PATH 上の git.exe のフォルダから辿る
 */
export function gitBashCandidates(
  env: NodeJS.ProcessEnv,
  exists: (p: string) => boolean = existsSync
): string[] {
  const w = path.win32
  const roots = [env.ProgramW6432, env.ProgramFiles, env['ProgramFiles(x86)']]
    .filter((r) => r !== undefined)
    .map((r) => w.join(r, 'Git'))
  if (env.LOCALAPPDATA) roots.push(w.join(env.LOCALAPPDATA, 'Programs', 'Git'))
  // git.exe は Git\cmd か Git\bin にあり、その親が Git のフォルダ
  for (const dir of (env.PATH ?? env.Path ?? '').split(';')) {
    if (dir && exists(w.join(dir, 'git.exe'))) roots.push(w.dirname(dir))
  }
  return [...new Set(roots.map((r) => w.join(r, 'bin', 'bash.exe')))]
}

/**
 * PowerShell に渡すコマンド。出力を UTF-8 にしてからスクリプトを呼ぶ（Windows PowerShell 5.1 は既定で
 * コードページの文字コードで出すため。-File だと構文エラーの文字も化ける）。
 * 構文エラーなどで止まったら 1、それ以外はスクリプトの exit の値で終わる
 */
export function powershellCommand(file: string): string {
  const quoted = `'${file.replaceAll("'", "''")}'`
  return [
    '[Console]::OutputEncoding = [Text.Encoding]::UTF8',
    // 止まった理由だけを出す（Write-Error だと、この呼び出しのコマンドまで表示される）
    `try { & ${quoted} } catch { [Console]::Error.WriteLine($_.Exception.Message); exit 1 }`,
    'exit $LASTEXITCODE'
  ].join('; ')
}

/** Windows の python.exe スタブ（Microsoft Store への案内）が返す終了コード */
const PYTHON_STUB_EXIT = 9009

/** 起動するコマンドの候補。先頭が見つからなければ次を試す */
function commands(req: RunRequest, file: string): string[][] {
  const win = req.platform === 'win32'
  switch (req.kind) {
    case 'bat':
      return [['cmd.exe', '/d', '/c', file]]
    case 'sh':
      return win
        ? gitBashCandidates(req.env).map((bash) => [bash, file.replaceAll('\\', '/')])
        : [['bash', file]]
    case 'powershell': {
      const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', powershellCommand(file)]
      return win
        ? [
            ['pwsh', ...args],
            ['powershell', ...args]
          ]
        : [['pwsh', ...args]]
    }
    case 'python':
      // Windows の python.exe は、Python が無くても Microsoft Store へ案内するスタブのことがあるため、
      // python.org の Python に付く py ランチャーを先に試す
      return win
        ? [
            ['py', file],
            ['python', file]
          ]
        : [
            ['python3', file],
            ['python', file]
          ]
  }
}

/** スクリプトを一時ファイルに書き出して実行し、出力を行ごとに渡す */
export async function startRun(
  req: RunRequest,
  onLines: (stream: Stream, lines: string[]) => void
): Promise<RunHandle> {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'work-launcher-'))
  const file = path.join(dir, `run${EXT[req.kind]}`)
  const body = req.kind === 'bat' ? req.script.replace(/\r?\n/g, '\r\n') : req.script
  // bat は cmd がコードページで読むため、出力と同じ文字コードで書く。
  // ps1 は BOM が無いと Windows PowerShell 5.1 がコードページの文字コードで読むため、BOM を付ける
  await writeFile(
    file,
    req.kind === 'bat'
      ? iconv.encode(body, req.encoding)
      : req.kind === 'powershell'
        ? '﻿' + body
        : body
  )

  let child: ChildProcess | undefined
  let stopped = false
  const done = (async (): Promise<RunResult> => {
    try {
      for (const [cmd, ...args] of commands(req, file)) {
        if (stopped) return { code: null, signal: 'SIGTERM' }
        const r = await spawnOnce(cmd, args, req, onLines, (c) => (child = c))
        if (r === 'not-found') continue
        if (req.kind === 'python' && req.platform === 'win32' && r.code === PYTHON_STUB_EXIT) {
          return {
            ...r,
            error: t().run.storePython
          }
        }
        return r
      }
      throw new Error(
        req.kind === 'sh' && req.platform === 'win32'
          ? t().run.noGitBash
          : t().run.noCommand(req.kind)
      )
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })()

  return {
    done,
    stop() {
      stopped = true
      if (child?.pid !== undefined && child.exitCode === null) killTree(child.pid, req.platform)
    }
  }
}

function spawnOnce(
  cmd: string,
  args: string[],
  req: RunRequest,
  onLines: (stream: Stream, lines: string[]) => void,
  onSpawn: (child: ChildProcess) => void
): Promise<RunResult | 'not-found'> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: req.cwd,
      env: req.env,
      // 標準入力は空にする。pause・set /p・read などの入力待ちで止まらず進む
      stdio: ['ignore', 'pipe', 'pipe'],
      // POSIX ではプロセスグループごと止められるように分ける
      detached: req.platform !== 'win32',
      windowsHide: true
    })
    onSpawn(child)
    const flushers = (['stdout', 'stderr'] as const).map((stream) =>
      pipeLines(child[stream]!, req.encoding, (lines) => onLines(stream, lines))
    )
    child.on('error', (e: NodeJS.ErrnoException) => {
      if (e.code === 'ENOENT') resolve('not-found')
      else reject(e)
    })
    child.on('close', (code, signal) => {
      flushers.forEach((flush) => flush())
      resolve({ code, signal })
    })
  })
}

/** 文字コードを変換して行に分ける。返す関数で、改行の無い最後の行を出す */
function pipeLines(
  stream: NodeJS.ReadableStream,
  encoding: string,
  emit: (lines: string[]) => void
): () => void {
  const decoder = iconv.getDecoder(encoding)
  let rest = ''
  stream.on('data', (chunk: Buffer) => {
    const lines = (rest + decoder.write(chunk)).split(/\r?\n/)
    rest = lines.pop()!
    if (lines.length > 0) emit(lines)
  })
  return () => {
    const last = rest + (decoder.end() ?? '')
    rest = ''
    if (last) emit([last])
  }
}

function killTree(pid: number, platform: NodeJS.Platform): void {
  if (platform === 'win32') {
    spawn('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true })
    return
  }
  try {
    process.kill(-pid, 'SIGTERM')
  } catch {
    // 既に終わっている
  }
}
