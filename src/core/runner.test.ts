import { mkdtempSync, mkdirSync, realpathSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { gitBashCandidates, powershellCommand, prepareRun, startRun } from './runner'
import type { RunHandle, RunRequest, Stream } from './runner'
import type { Item, Page, Project } from './types'

const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'runner-test-')))
mkdirSync(path.join(dir, 'tools'))

const project = (cwd?: string): Project => ({
  cwd,
  styles: [],
  scripts: [],
  pages: [],
  info: { env: [], tools: [], registry: [] }
})
const page: Page = { id: 'top', items: [] }
const sh = (script: string, extra: Partial<Item> = {}): Item =>
  ({ kind: 'exec', scripts: { sh: script }, ...extra }) as Item

async function run(
  req: RunRequest
): Promise<{ handle: RunHandle; out: { stream: Stream; line: string }[] }> {
  const out: { stream: Stream; line: string }[] = []
  const handle = await startRun(req, (stream, lines) =>
    lines.forEach((line) => out.push({ stream, line }))
  )
  return { handle, out }
}

// 実在する一時フォルダを cwd に使うため、この OS のパスとして解決させる
describe('prepareRun', () => {
  it('select の値を置き換え、無い ID は警告にする', () => {
    const item = sh('deploy ${select:env}${select:nope}', { env: { TARGET: '${select:env}' } })
    const req = prepareRun(project(), page, item, dir, {}, process.platform, { env: 'prod' })
    expect(req).toMatchObject({
      script: 'deploy prod',
      env: { TARGET: 'prod' },
      warnings: ['select nope がありません']
    })
  })

  it('変数を置き換え、cwd を引き継いで解決する', () => {
    const item = sh('echo ${launcherDir} ${workDir} ${env:FOO} ${HOME}', {
      env: { A: '${env:FOO}-x' }
    })
    const req = prepareRun(project('tools'), page, item, dir, { FOO: 'foo' }, process.platform)
    expect(req).toMatchObject({
      kind: 'sh',
      script: `echo ${dir} ${path.join(dir, 'tools')} foo \${HOME}`,
      cwd: path.join(dir, 'tools'),
      env: { FOO: 'foo', A: 'foo-x' },
      encoding: 'utf-8',
      warnings: []
    })
  })

  // Windows のパスとして作業フォルダを確かめるため、Windows でだけ流す
  it.runIf(process.platform === 'win32')('bat の既定の文字コードは cp932', () => {
    const item: Item = { kind: 'exec', scripts: { bat: 'echo a', sh: 'echo a' } }
    expect(prepareRun(project(), page, item, dir, {}, 'win32')).toMatchObject({
      kind: 'bat',
      encoding: 'cp932'
    })
  })

  it('python には PYTHONIOENCODING=utf-8 を渡す。決めてあればそちらを使う', () => {
    const py = (extra: Partial<Item> = {}): Item =>
      ({ kind: 'exec', scripts: { python: 'print(1)' }, ...extra }) as Item
    const envOf = (item: Item, env: NodeJS.ProcessEnv): NodeJS.ProcessEnv | undefined => {
      const req = prepareRun(project(), page, item, dir, env, process.platform)
      return typeof req === 'string' ? undefined : req.env
    }
    expect(envOf(py(), {})?.PYTHONIOENCODING).toBe('utf-8')
    expect(envOf(py(), { PYTHONIOENCODING: 'cp932' })?.PYTHONIOENCODING).toBe('cp932')
    expect(envOf(py({ env: { PYTHONIOENCODING: 'latin-1' } }), {})?.PYTHONIOENCODING).toBe(
      'latin-1'
    )
    expect(envOf(sh('echo'), {})?.PYTHONIOENCODING).toBeUndefined()
  })

  it('未定義の環境変数は警告に入れる', () => {
    const req = prepareRun(project(), page, sh('${env:NOPE}${env:NOPE}'), dir, {}, process.platform)
    expect(req).toMatchObject({ warnings: ['環境変数 NOPE が定義されていません'] })
  })

  it('実行できないときは理由を返す', () => {
    const bat: Item = { kind: 'exec', scripts: { bat: 'x' } }
    expect(prepareRun(project(), page, bat, dir, {}, 'darwin')).toBe('この OS では実行できません')
    expect(prepareRun(project('none'), page, sh('x'), dir, {}, 'darwin')).toMatch(
      /^作業フォルダがありません/
    )
  })
})

describe.skipIf(process.platform === 'win32')('startRun（sh）', () => {
  const base = { kind: 'sh', cwd: dir, encoding: 'utf-8', platform: process.platform, warnings: [] }

  it('出力を行ごとに渡し、終了コードを返す', async () => {
    const { handle, out } = await run({
      ...base,
      kind: 'sh',
      script: 'pwd\necho "$GREETING"\necho err >&2\nprintf no-newline\nexit 3',
      env: { ...process.env, GREETING: 'こんにちは' }
    })
    expect(await handle.done).toEqual({ code: 3, signal: null })
    expect(out).toEqual([
      { stream: 'stdout', line: dir },
      { stream: 'stdout', line: 'こんにちは' },
      { stream: 'stderr', line: 'err' },
      { stream: 'stdout', line: 'no-newline' }
    ])
  })

  it('入力待ちで止まらずに進む', async () => {
    const { handle, out } = await run({
      ...base,
      kind: 'sh',
      script: 'read answer\necho "after:$answer"',
      env: process.env
    })
    expect(await handle.done).toEqual({ code: 0, signal: null })
    expect(out.map((o) => o.line)).toEqual(['after:'])
  })

  it('停止すると子プロセスごと止まる', async () => {
    const { handle, out } = await run({
      ...base,
      kind: 'sh',
      script: 'echo start\nsleep 30\necho never',
      env: process.env
    })
    await new Promise((r) => setTimeout(r, 300))
    handle.stop()
    const result = await handle.done
    expect(result.code === null || result.code !== 0).toBe(true)
    expect(out.map((o) => o.line)).toEqual(['start'])
  })
})

// Windows PowerShell 5.1 の文字コードの扱いを確かめるため、Windows でだけ流す
describe.runIf(process.platform === 'win32')('startRun（powershell）', () => {
  const base: Omit<RunRequest, 'script'> = {
    kind: 'powershell',
    cwd: dir,
    encoding: 'utf-8',
    platform: process.platform,
    env: process.env,
    warnings: []
  }

  it('日本語の本文を読み、出力・エラーを UTF-8 で受け取り、exit の値を返す', async () => {
    const { handle, out } = await run({
      ...base,
      script: 'Write-Output "日本語テスト"\n[Console]::Error.WriteLine("エラー 日本語")\nexit 3'
    })
    expect(await handle.done).toEqual({ code: 3, signal: null })
    expect(out).toEqual([
      { stream: 'stdout', line: '日本語テスト' },
      { stream: 'stderr', line: 'エラー 日本語' }
    ])
  }, 30_000)

  it('構文エラーは理由だけを出して 1 で終わる', async () => {
    const { handle, out } = await run({ ...base, script: 'Write-Output "閉じていない' })
    expect(await handle.done).toEqual({ code: 1, signal: null })
    expect(out.every((o) => o.stream === 'stderr')).toBe(true)
    expect(out.map((o) => o.line).join('\n')).not.toContain('OutputEncoding')
  }, 30_000)
})

describe('powershellCommand', () => {
  it('出力を UTF-8 にしてから呼ぶ。パスの引用符は重ねる', () => {
    const c = powershellCommand("C:\\Users\\o'brien\\run.ps1")
    expect(c.startsWith('[Console]::OutputEncoding = [Text.Encoding]::UTF8; ')).toBe(true)
    expect(c).toContain("& 'C:\\Users\\o''brien\\run.ps1'")
    expect(c.endsWith('exit $LASTEXITCODE')).toBe(true)
  })
})

describe('gitBashCandidates', () => {
  it('標準のインストール先と、PATH 上の git.exe から Git Bash を探す', () => {
    const env = {
      ProgramFiles: 'C:\\Program Files',
      LOCALAPPDATA: 'C:\\Users\\u\\AppData\\Local',
      Path: 'C:\\Windows\\System32;D:\\Tools\\Git\\cmd'
    }
    const exists = (p: string): boolean => p === 'D:\\Tools\\Git\\cmd\\git.exe'
    expect(gitBashCandidates(env, exists)).toEqual([
      'C:\\Program Files\\Git\\bin\\bash.exe',
      'C:\\Users\\u\\AppData\\Local\\Programs\\Git\\bin\\bash.exe',
      'D:\\Tools\\Git\\bin\\bash.exe'
    ])
  })
})
