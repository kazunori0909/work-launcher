# Phase 11 タスク

各行を終えるたびに `npm run lint && npm run typecheck && npm test` を通す。詳細は PLAN.md の同じ記号の節。

## E（前半）: 動きを固定する

- [x] `vitest.config.ts` を置く（`src/**/*.test.ts` だけを探す）
- [x] `examples/sample` を読んだ結果（Project・diagnostics）を固定するテストを足す

## A: IPC の約束

- [x] `src/core/ipc.ts` にチャンネルと通知の型をまとめ、`RunEvent`・`LauncherApi` を移す
- [x] プリロードを、その型から作る形にする
- [x] メインの登録を型つきの `handle` に替える（`windows`・`runs`・`actions`・`links`・`info`・`selections`・`licenses`）
- [x] 画面から来る引数（`pageId`・`path`・`select`）を確かめる関数を1か所にし、全部のハンドラで使う

## B: ウィンドウごとのセッション

- [x] `userData` の JSON の読み書きを `main/jsonStore.ts` にまとめる（`recent`・`selections`・`trust`）
- [x] `callFunction` を `main/scriptCall.ts` に出す
- [x] 実行中のプロセスと function の子プロセスをウィンドウのセッションに持たせ、「全部止める」を1つにする
- [x] `run:event` を送る処理をセッションの1か所にする
- [x] 「どのウィンドウで開くか」を純粋な関数にして `core` に置き、テストを足す

## C: 項目の種類

- [x] `load.ts` を `core/load/` に分ける（移すだけ。外から見える名前は変えない）
- [x] 項目の読み方を種類ごとの表にし、`TYPE_KEYS`・`EXTRA_KEYS`・`OWN_KEYS` を表から作る
- [x] `items.ts`・`actions.ts`・`PageView.tsx` の `switch` から `default:` を無くし、`never` で確かめる

## D: 画面

- [x] 実行イベント → コンソールの行、ページの並べ方、select の値の決め方を純粋な関数にしてテストを足す
- [x] `App.tsx` から `useProjectView`・`useConsole`・`useSelections` を出す
- [x] `HelpPage.tsx` を章ごとのファイルに分ける
- [x] `main.css` を画面ごとのファイルに分ける（クラス名・CSS 変数は変えない）

## E（残り）: テスト

- [x] `load.test.ts` の前置きを助けの関数にまとめ、エラーの並びを `it.each` にする（`examples.test.ts` と共通にする）
- [x] `npm run coverage` を足し、テストが無い場所を見て要るものを足す
- [x] `build:mac` も typecheck を通す

## F: sandbox

- [x] （最後に）`sandbox: true` にする
- [x] Mac で確かめる（タブ・項目・ヘルプ・exec・おかしな引数。KNOWLEDGE.md。2026-11-15 にユーザーも確認）
- [x] Windows で `npm run dev` で確かめる（タブ・ヘルプ・bat・sh・function の実行許可・Office・おかしな引数。2026-11-15 にユーザーが確認）
- [x] Windows で `npm test` を流す（Windows でだけ流すテスト 3 件。2026-11-15 にユーザーが確認）
- [x] Windows のポータブル版で起動を確かめる（2026-11-15 にユーザーが確認）

## 共通

- [x] `AGENTS.md` のフォルダ構成を直す
- [x] 実機調査で判明した挙動・制約を KNOWLEDGE.md に記録
- [x] 個人情報チェック（追跡ファイルに実値が混入していないか）
