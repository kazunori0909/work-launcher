# Phase 2 で確かめた挙動・制約

## VS Code の拡張機能から起動したシェルでは Electron が Node として動く

- 拡張機能（Claude Code など）のシェルには `ELECTRON_RUN_AS_NODE=1` が入っていることがある。
  このまま `npm run dev` すると、`@electron-toolkit/utils` の読み込みで落ちる。
  `npx electron --version` も Electron ではなく Node のバージョンを返す
- 回避: `env -u ELECTRON_RUN_AS_NODE npm run dev`。普通のターミナルからなら起こらない

## 画面の確認は CDP で撮る

- `screencapture` は画面収録の許可待ちで止まる（許可していない環境では返ってこない）
- 代わりに `electron-vite build` のあと `LAUNCHER_PROJECT=<案件> Electron --remote-debugging-port=9222 .` で起動し、
  `http://127.0.0.1:9222/json` から取った WebSocket で `Page.captureScreenshot` を呼ぶ。
  Node 24 は `fetch`・`WebSocket` が組み込みなので追加の依存は要らない

## Mac でフォルダを開くと Finder のウィンドウが全部前に出る

- `shell.openPath`（= `open`）でフォルダを開くと Finder が丸ごと前面に来て、ほかの Finder ウィンドウも前に出る
- 対策: Finder を前面に出さずに開き（`NSWorkspaceLaunchWithoutActivation`）、Finder の主ウィンドウだけを前面に出す
  （`NSRunningApplication.activateWithOptions(0)`）。osascript の JavaScript から呼べ、オートメーション・
  画面収録の許可は要らない（ウィンドウは名前を見ず、`CGWindowListCopyWindowInfo` の番号と持ち主 PID だけ使う）
- 前面化が早すぎると、前からある別のウィンドウが主ウィンドウとして前に出る。新しいウィンドウが現れるのを待つ
- 実測（開発機の macOS）: osascript の起動 約65ms、ウィンドウ一覧の初回 約45ms、`open -g` コマンド 約150ms、
  開く指示から Finder がウィンドウを作るまで 約300ms。osascript を1回にまとめて、押してから約0.5秒
- 固定の待ち時間（0.3秒）は、ウィンドウがまだ無い時点で前面化して失敗した。一番手前の変化だけを待つ方式は、
  プロセス起動の積み重ねで約1秒かかった
