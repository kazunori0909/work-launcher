# Phase 11 で確かめたこと

## sandbox を有効にしたプリロード（2026-11-15・macOS）

- electron-vite 6 の出力するプリロードは CommonJS で、読むのは `require("electron")` だけ
  （`core/ipc.ts` は1つのファイルにまとめられる）。sandbox のプリロードが読めるのは `electron` などに限られるため、これで足りる
- `sandbox: true` で起動し、DevTools のプロトコル（`--remote-debugging-port`）で画面の中を確かめた
  - `window.launcher` は 14 個の関数を持ち、`require` は無い（sandbox が効いている）
  - サンプル案件のタブ・項目・ヘルプの章・CSS 変数が出る。sh の項目を押すとコンソールに開始・出力・終了が出る
  - 型の違う引数（`activate(1, "x", null)`）は「項目が見つかりません」で断られる
- ユーザーも開発中のアプリ（`npm run dev`）の DevTools で同じ呼び出しを試し、同じエラーが返ることを確かめた（2026-11-15）
- Windows（2026-11-15・ユーザーが `npm run dev` で確認）: タブ・ヘルプ・bat・sh・function（初回の実行許可のダイアログを含む）・
  Office のボタンが動き、おかしな引数は同じエラーで断られた。`npm test`（Windows でだけ流すテストを含む）も通り、
  ポータブル版（`build:win` の portable.exe）も起動した

## 開発中に Electron を手で起動するとき

- VS Code の中のターミナル（拡張機能から動くツールを含む）では `ELECTRON_RUN_AS_NODE=1` が入っていることがあり、
  `npx electron .` が Node として動いて `app` が undefined になる。`env -u ELECTRON_RUN_AS_NODE npx electron .` で起動する
