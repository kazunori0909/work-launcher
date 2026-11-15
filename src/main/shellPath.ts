import { execFile } from 'node:child_process'

const MARK = '__WORKLAUNCHER_PATH__'

let ready: Promise<void> = Promise.resolve()

/**
 * Mac では、ログインシェルの PATH をアプリの PATH にする。Finder から起動したアプリの PATH は
 * /usr/bin:/bin 程度で、mise・Homebrew で入れたツールが見つからないため。
 * 起動時に呼び、コマンドを動かす前に shellPathReady() を待つ
 */
export function loadShellPath(): void {
  if (process.platform !== 'darwin') return
  ready = new Promise((resolve) => {
    const shell = process.env.SHELL || '/bin/zsh'
    // .zshrc に PATH を書く人が多いため、対話シェル（-i）としても読む。rc の出力に紛れないよう印で挟む
    execFile(
      shell,
      ['-ilc', `printf '${MARK}%s${MARK}' "$PATH"`],
      { timeout: 5000, env: process.env },
      (_, stdout) => {
        const path = new RegExp(`${MARK}(.*)${MARK}`, 's').exec(stdout ?? '')?.[1]
        // シェルが受け取った PATH にさらに足すため、同じフォルダが重なる。先に出た方を残す
        if (path) process.env.PATH = [...new Set(path.split(':').filter(Boolean))].join(':')
        resolve()
      }
    )
  })
}

export function shellPathReady(): Promise<void> {
  return ready
}
