# Phase 10 で確かめたこと

## Electron の close イベント（2026-11-15・Mac）

- `BrowserWindow.close()`（閉じるボタン・⌘W・メニューの閉じる）は `close` イベントを出し、
  `preventDefault()` で止めて `beforeClose` を待てる
- 画面の JS の `window.close()` では、Playwright から呼んだとき `close` を経ずに閉じた。
  アプリは画面から `window.close()` を呼ばないので、困らない
- アプリの終了（⌘Q・`app.quit()`）は `before-quit` で止めて待ち、待ち終えたら `app.quit()` を呼び直す

## 実機を Playwright で動かすとき（2026-11-15・Mac）

- VS Code の拡張から開いたシェルでは `ELECTRON_RUN_AS_NODE=1` が入っており、Electron が Node として起動して
  `bad option` で落ちる。起動するときの環境変数から外す
- `--user-data-dir=<フォルダ>` でユーザーデータ（`trusted-projects.json` など）を分けられる。
  先に `trusted-projects.json` に案件フォルダを書いておくと、JS の実行の確認を出さずに確かめられる
