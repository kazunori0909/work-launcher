import { describe, expect, it } from 'vitest'
import {
  effectiveCwd,
  expandVariables,
  resolveConfigPath,
  resolveWorkDir,
  variableContext
} from './variables'
import type { Item, Page, Project } from './types'

const ctx = {
  launcherDir: '/repo/tools',
  workDir: '/repo',
  env: { HOME: '/home/u', 'ProgramFiles(x86)': 'C:\\PF' }
}

describe('expandVariables', () => {
  it('launcherDir・workDir・env を置き換える', () => {
    expect(expandVariables('${launcherDir}/a ${workDir}/b ${env:HOME}', ctx).value).toBe(
      '/repo/tools/a /repo/b /home/u'
    )
    expect(expandVariables('${env:ProgramFiles(x86)}', ctx).value).toBe('C:\\PF')
  })

  it('それ以外の ${...} は残す（旧名の projectDir も置き換えない）', () => {
    expect(expandVariables('echo ${HOME} ${1:-x} ${projectDir}', ctx).value).toBe(
      'echo ${HOME} ${1:-x} ${projectDir}'
    )
  })

  it('workDir が決まっていない（cwd を展開するとき）は ${workDir} を残す', () => {
    expect(expandVariables('${workDir}/x', { launcherDir: '/r', env: {} }).value).toBe(
      '${workDir}/x'
    )
  })

  it('$$ でエスケープする', () => {
    expect(expandVariables('$${launcherDir} $${workDir}', ctx).value).toBe(
      '${launcherDir} ${workDir}'
    )
  })

  it('未定義の環境変数は空文字にして名前を返す', () => {
    expect(expandVariables('a${env:NOPE}b', ctx)).toEqual({
      value: 'ab',
      missingEnv: ['NOPE'],
      missingSelect: []
    })
  })

  it('select の値を置き換える。無い ID は空文字にして名前を返し、$$ はエスケープ', () => {
    const r = expandVariables('${select:env} ${select:nope} $${select:env}', {
      ...ctx,
      select: { env: 'prod' }
    })
    expect(r).toEqual({ value: 'prod  ${select:env}', missingEnv: [], missingSelect: ['nope'] })
  })

  it('select の値を渡さないとき（cwd・md・style）は ${select:ID} を残す', () => {
    expect(expandVariables('${select:env}', ctx)).toMatchObject({
      value: '${select:env}',
      missingSelect: []
    })
  })
})

describe('resolveConfigPath', () => {
  it('相対パスは launcherDir 起点、絶対パスはそのまま', () => {
    expect(resolveConfigPath('../scripts', '/w/repo', 'darwin')).toBe('/w/scripts')
    expect(resolveConfigPath('/opt/s', '/w/repo', 'darwin')).toBe('/opt/s')
    expect(resolveConfigPath('tools\\a', '/w/repo', 'darwin')).toBe('/w/repo/tools/a')
    expect(resolveConfigPath('tools/a', 'C:\\repo', 'win32')).toBe('C:\\repo\\tools\\a')
    expect(resolveConfigPath('D:\\s', 'C:\\repo', 'win32')).toBe('D:\\s')
  })
})

const exec = (cwd?: string): Item => ({ kind: 'exec', scripts: { sh: 'x' }, cwd })
const page = (cwd?: string): Page => ({ id: 'p', cwd, items: [] })
const project = (cwd?: string): Project => ({
  cwd,
  styles: [],
  scripts: [],
  pages: [],
  info: { env: [], tools: [], registry: [] }
})

describe('effectiveCwd', () => {
  it('項目 → ページ → 最上位の順に引き継ぐ', () => {
    expect(effectiveCwd(project('a'), page('b'), exec('c'))).toBe('c')
    expect(effectiveCwd(project('a'), page('b'), exec())).toBe('b')
    expect(effectiveCwd(project('a'), page(), exec())).toBe('a')
    expect(effectiveCwd(project(), page(), exec())).toBeUndefined()
  })

  it('ページ・項目を省けば最上位。実行系以外の項目の cwd は見ない', () => {
    expect(effectiveCwd(project('a'))).toBe('a')
    const open = { kind: 'open', path: 'x' } as Item
    expect(effectiveCwd(project('a'), page('b'), open)).toBe('b')
  })
})

describe('作業フォルダ', () => {
  it('resolveWorkDir: 変数を置き換えて launcherDir 起点で解決する。無ければ launcherDir', () => {
    const env = { ROOT: '/w' }
    expect(resolveWorkDir('../..', '/repo/tools/launcher', env, 'darwin').dir).toBe('/repo')
    expect(resolveWorkDir('${env:ROOT}/x', '/repo', env, 'darwin').dir).toBe('/w/x')
    expect(resolveWorkDir(undefined, '/repo', env, 'darwin').dir).toBe('/repo')
  })

  it('variableContext: 最上位の cwd から workDir を作る', () => {
    expect(variableContext(project('..'), '/repo/tools', {}, page(), undefined, 'darwin')).toEqual({
      launcherDir: '/repo/tools',
      workDir: '/repo',
      env: {}
    })
  })
})
