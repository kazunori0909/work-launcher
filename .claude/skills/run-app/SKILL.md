---
name: run-app
description: WorkLauncher の実機（Electron）を Playwright で起動し、クリック・select の変更・スクリーンショット・ウィンドウを閉じる・終了するを行って、変更が実際のアプリで動くか確かめる。「実機で確かめて」「アプリを動かして」「スクリーンショットを撮って」のときに使う。
---

# 実機で動かす

`driver.mjs` がアプリを起動し、標準入力のコマンドを1行ずつ実行する。Mac・Windows で確かめた手順。

## 手順

1. **ビルドする**（`out/` を作る。`npm run dev` は使わない）

   ```bash
   npx electron-vite build
   ```

2. **案件を用意する**。リポジトリの `examples/sample` を書き換えずに確かめたいときは、スクラッチパッドにコピーして使う。
   イベント（beforeOpen など）の確かめには、関数の中で `ctx.launcherDir` にログのファイルを書くと、閉じたあとでも読める

3. **コマンドを流す**（スクリーンショットは `SHOT_DIR`。省略時は OS の一時フォルダ）

   ```bash
   SHOT_DIR=<スクラッチパッド>/shots node .claude/skills/run-app/driver.mjs <案件フォルダ> <<'EOF'
   wait button.tab
   click button.tab:has-text("サンプル")
   select select stg
   sleep 1500
   ss after-change
   close
   sleep 2000
   windows
   EOF
   ```

4. **スクリーンショットを Read で見る**。真っ白なら起動に失敗している

## コマンド

| コマンド                 | 内容                                                                |
| ------------------------ | ------------------------------------------------------------------- |
| `wait <セレクタ>`        | 要素が出るまで待つ（最大30秒。beforeOpen の間は案件の画面が出ない） |
| `sleep <ミリ秒>`         | 待つ（ウィンドウを閉じたあとも使える）                              |
| `click <セレクタ>`       | クリックする                                                        |
| `mclick <セレクタ>`      | 中ボタンでクリックする（リンクの中クリックの確かめ）                |
| `select <セレクタ> <値>` | select の値を選ぶ（最初に当たった要素）                             |
| `text <セレクタ>`        | 文字を出す                                                          |
| `ss <名前>`              | スクリーンショットを `SHOT_DIR/<名前>.png` に撮る                   |
| `close`                  | 閉じるボタン・⌘W と同じ閉じ方（beforeClose を待つ）                 |
| `quit`                   | ⌘Q と同じ終了。待つ時間は続けて `sleep` で取る                      |
| `windows`                | 開いているウィンドウの数                                            |
| `eval <JS>`              | 画面で JS を評価して結果を出す                                      |

`#` で始まる行と空行は読み飛ばす。セレクタは Playwright の書き方（`button.tab:has-text("ヘルプ")` など）。

## 注意

- ドライバは起動のたびに新しいユーザーデータのフォルダ（`--user-data-dir`）を作り、案件を信頼済みにしておく。
  JS の実行の確認は出ず、記憶した select の値も持ち越さない。手元のアプリの設定にも触れない
- VS Code のシェルは `ELECTRON_RUN_AS_NODE=1` が入っており、そのままだと Electron が Node として起動して
  `bad option` で落ちる。ドライバは起動時にこの変数を外している
- 画面の JS の `window.close()` は `close` イベントを経ずに閉じるので、閉じる確認には `close` を使う
- 背景は docs/archive/phase10-lifecycle-events/KNOWLEDGE.md
