# Phase 34: ファイル名と置き場所の整理

## 課題

- `src/main` に、名前から違いがわからない組がある（`run.ts` と `runs.ts`、`open.ts` と `openFolder.ts`）
- `renderer/src/components/` にコンポーネントでないもの（`highlight.ts`）があり、
  アイコンの表（`icons.ts`・`iconNames.ts`）は `renderer/src` の直下に散っている
- 画面の CSS が `assets/styles/` にある（`assets/` は画像などの静的ファイルの置き場という扱いが一般的）

## 方針

- 動作は変えない。ファイルの移動・改名と import の張り替えだけにする（`git mv` で履歴を追えるようにする）
- `src/main/run.ts` → `exec.ts`（子プロセスを動かす関数。`runs.ts` は実行の IPC ハンドラのまま）
- `src/main/openFolder.ts` を `open.ts` にまとめる
- `renderer/src/lib/` を作り、`highlight.ts`・`icons.ts`・`iconNames.ts`（とそのテスト）を移す
- `renderer/src/assets/styles/` → `renderer/src/styles/`、`assets/main.css` → `styles/index.css`
- 直さないもの: 層をまたぐ同名ファイル、`src/core` の平らな構成、`embed.tsx` の名前、
  `site/helpIcons.ts` の場所、`renderer/src` の二重の `src`、`.github/changelog.yaml`

## 決定事項ログ

### 2026-11-23: 名前の紛らわしい組・置き場所のずれだけを直す

- 機能ごとのフォルダへの組み替えなどはしない。理由: いまの骨格は electron-vite の雛形とよくある作法に沿っていて、
  困っているのは名前と置き場所の一部だけだから
- `embed.tsx` は改名しない。サイトがこのパスで差し替えていて（`site/astro.config.mjs`）、手間に見合わない
