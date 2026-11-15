// WorkLauncher を Playwright で起動し、標準入力のコマンドを1行ずつ実行する（使い方は SKILL.md）
import { _electron } from 'playwright-core'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import readline from 'node:readline'

const APP_DIR = path.resolve(import.meta.dirname, '../../..')
const project = process.argv[2] && path.resolve(process.argv[2])
if (!project || !fs.existsSync(path.join(project, 'work.launcher'))) {
  console.error('使い方: node driver.mjs <案件フォルダ（work.launcher がある）> < commands.txt')
  process.exit(2)
}
const shotDir = path.resolve(process.env.SHOT_DIR ?? path.join(os.tmpdir(), 'work-launcher-shots'))
fs.mkdirSync(shotDir, { recursive: true })

// ユーザーデータは毎回新しいフォルダにし、案件を信頼済みにしておく（JS の実行の確認を出さない）
const userData = fs.mkdtempSync(path.join(os.tmpdir(), 'work-launcher-ud-'))
fs.writeFileSync(path.join(userData, 'trusted-projects.json'), JSON.stringify([project]))

const electronBin =
  process.platform === 'darwin'
    ? 'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron'
    : process.platform === 'win32'
      ? 'node_modules/electron/dist/electron.exe'
      : 'node_modules/electron/dist/electron'

// VS Code のシェルでは ELECTRON_RUN_AS_NODE=1 が入っていて、Electron が Node として起動してしまう
const env = Object.fromEntries(
  Object.entries(process.env).filter(([k]) => k !== 'ELECTRON_RUN_AS_NODE')
)
const app = await _electron.launch({
  executablePath: path.join(APP_DIR, electronBin),
  args: [`--user-data-dir=${userData}`, APP_DIR],
  env: { ...env, LAUNCHER_PROJECT: project },
  timeout: 30_000
})
const page = await app.firstWindow()
console.log(`launched: ${project}`)
console.log(`userData: ${userData}`)

const COMMANDS = {
  /** 要素が出るまで待つ（beforeOpen の間は出ない） */
  wait: (sel) => page.waitForSelector(sel, { timeout: 30_000 }),
  // ウィンドウを閉じたあとも待てるよう、ページではなく Node で待つ
  sleep: (ms) => new Promise((r) => setTimeout(r, Number(ms))),
  click: (sel) => page.click(sel),
  mclick: (sel) => page.click(sel, { button: 'middle' }),
  /** select の値を選ぶ: select <セレクタ> <値> */
  select: async (rest) => {
    const i = rest.lastIndexOf(' ')
    await page
      .locator(rest.slice(0, i))
      .first()
      .selectOption(rest.slice(i + 1))
  },
  text: async (sel) => console.log(await page.locator(sel).first().textContent()),
  ss: async (name) => {
    const file = path.join(shotDir, `${name || Date.now()}.png`)
    await page.screenshot({ path: file })
    console.log(`screenshot: ${file}`)
  },
  /** 閉じるボタン・⌘W と同じ閉じ方（画面の window.close() は close イベントを経ないので使わない） */
  close: () => app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0]?.close()),
  /** ⌘Q と同じ終了。beforeClose を待つので、待つ時間は続けて sleep で取る */
  quit: () => void app.evaluate(({ app }) => app.quit()).catch(() => {}),
  windows: () => console.log(`windows: ${app.windows().length}`),
  /** 画面で JS を評価して結果を出す */
  eval: async (js) => console.log(await page.evaluate(js))
}

const rl = readline.createInterface({ input: process.stdin })
for await (const raw of rl) {
  const line = raw.trim()
  if (!line || line.startsWith('#')) continue
  const [cmd, ...args] = line.split(' ')
  const fn = COMMANDS[cmd]
  if (!fn) {
    console.log(`ERROR: 知らないコマンド ${cmd}（${Object.keys(COMMANDS).join(', ')}）`)
    continue
  }
  try {
    console.log(`> ${line}`)
    await fn(args.join(' '))
  } catch (err) {
    console.log(`ERROR: ${err instanceof Error ? err.message.split('\n')[0] : err}`)
  }
}
await app.evaluate(({ app }) => app.exit(0)).catch(() => {})
// Electron が書き終える前だと消せないことがある。残っても一時フォルダなので無視する
try {
  fs.rmSync(userData, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 })
} catch {
  // 何もしない
}
