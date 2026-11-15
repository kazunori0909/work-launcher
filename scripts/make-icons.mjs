// build/icons/*.svg からアプリとファイルのアイコンを書き出す（npm run icons。Mac で動かす）
// 出力: build/icon.{png,icns,ico}・build/document.{icns,ico}・resources/icon.png
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow } from 'electron'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const src = (name) => readFileSync(path.join(root, 'build/icons', name), 'utf8')
const out = (p) => path.join(root, p)

const toolbox = src('toolbox.svg')

/** 背景の余白を決めてアプリのアイコンの SVG を作る（Mac は余白と影をとる決まり、Windows は大きめに描く） */
function appSvg(inset) {
  const size = 1024 - inset * 2
  return src('app.svg')
    .replaceAll('{{inset}}', String(inset))
    .replaceAll('{{size}}', String(size))
    .replaceAll('{{radius}}', String(Math.round(size * 0.225)))
    .replaceAll('{{scale}}', String((size / 824) * 0.92))
    .replace('{{toolbox}}', toolbox)
}

const documentSvg = () => src('document.svg').replace('{{toolbox}}', toolbox)

/** SVG を 1024 四方の透過 PNG にする */
async function render(svg) {
  const win = new BrowserWindow({
    width: 1024,
    height: 1024,
    show: false,
    transparent: true,
    frame: false,
    useContentSize: true,
    webPreferences: { offscreen: true }
  })
  const html = `<html><body style="margin:0;background:transparent">${svg}</body></html>`
  // オフスクリーンでは capturePage が返らないことがあるため、paint で絵を受け取る。
  // 読み込み直後の描画は中身が空のことがあるので、少し待ってから描き直させた絵を使う
  let ready = false
  const image = await new Promise((resolve) => {
    win.webContents.on('paint', (_e, _dirty, img) => {
      if (ready) resolve(img)
    })
    win.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        ready = true
        win.webContents.invalidate()
      }, 500)
    })
    win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
  })
  win.destroy()
  return image.resize({ width: 1024, height: 1024, quality: 'best' })
}

const png = (image, size) => image.resize({ width: size, height: size, quality: 'best' }).toPNG()

function writeIcns(image, file) {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'icon-'))
  const iconset = path.join(dir, 'icon.iconset')
  execFileSync('mkdir', [iconset])
  for (const size of [16, 32, 128, 256, 512]) {
    writeFileSync(path.join(iconset, `icon_${size}x${size}.png`), png(image, size))
    writeFileSync(path.join(iconset, `icon_${size}x${size}@2x.png`), png(image, size * 2))
  }
  execFileSync('iconutil', ['-c', 'icns', iconset, '-o', file])
  rmSync(dir, { recursive: true })
}

/** PNG をそのまま入れた ICO（Windows Vista 以降が読める形） */
function writeIco(image, file) {
  const sizes = [16, 24, 32, 48, 64, 128, 256]
  const pngs = sizes.map((s) => png(image, s))
  const header = Buffer.alloc(6 + sizes.length * 16)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(sizes.length, 4)
  let offset = header.length
  sizes.forEach((s, i) => {
    const e = 6 + i * 16
    header.writeUInt8(s >= 256 ? 0 : s, e)
    header.writeUInt8(s >= 256 ? 0 : s, e + 1)
    header.writeUInt16LE(1, e + 4)
    header.writeUInt16LE(32, e + 6)
    header.writeUInt32LE(pngs[i].length, e + 8)
    header.writeUInt32LE(offset, e + 12)
    offset += pngs[i].length
  })
  writeFileSync(file, Buffer.concat([header, ...pngs]))
}

app.disableHardwareAcceleration()
// 1枚書き出すたびにウィンドウを閉じるため、ウィンドウが無くなっても終えない
app.on('window-all-closed', () => {})
app.whenReady().then(async () => {
  const mac = await render(appSvg(100))
  const win = await render(appSvg(40))
  const doc = await render(documentSvg())

  writeFileSync(out('build/icon.png'), png(mac, 1024))
  writeFileSync(out('resources/icon.png'), png(mac, 512))
  writeIcns(mac, out('build/icon.icns'))
  writeIco(win, out('build/icon.ico'))
  writeIcns(doc, out('build/document.icns'))
  writeIco(doc, out('build/document.ico'))
  // 見た目の確認用（ICON_PREVIEW_DIR を渡したときだけ）
  const preview = process.env['ICON_PREVIEW_DIR']
  if (preview) {
    for (const [name, image] of Object.entries({ mac, win, doc })) {
      for (const size of [512, 64, 32, 16]) {
        writeFileSync(path.join(preview, `${name}-${size}.png`), png(image, size))
      }
    }
  }
  console.log('アイコンを書き出しました')
  app.quit()
})
