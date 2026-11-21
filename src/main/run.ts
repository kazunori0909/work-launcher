import { exec, execFile } from 'node:child_process'

export interface Output {
  ok: boolean
  /** 標準出力と標準エラーをつないだもの（java -version は標準エラーに出す） */
  text: string
}

export const run = (
  file: string,
  args: string[],
  timeout = 10000,
  env?: NodeJS.ProcessEnv
): Promise<Output> =>
  new Promise((resolve) => {
    execFile(
      file,
      args,
      { timeout, encoding: 'utf8', windowsHide: true, env: env && { ...process.env, ...env } },
      (err, stdout, stderr) => resolve({ ok: !err, text: `${stdout ?? ''}${stderr ?? ''}` })
    )
  })

export const runShell = (
  command: string,
  cwd: string | undefined,
  timeout = 10000
): Promise<Output> =>
  new Promise((resolve) => {
    exec(command, { cwd, timeout, encoding: 'utf8', windowsHide: true }, (err, stdout, stderr) =>
      resolve({ ok: !err, text: `${stdout ?? ''}${stderr ?? ''}` })
    )
  })
