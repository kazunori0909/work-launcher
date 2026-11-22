# WorkLauncher — 何がどこにあるか

**このファイルはプロジェクトの地図。** 守るルールは [CLAUDE.md](CLAUDE.md)、
決定の理由は [docs/](docs/README.md) にある。

## 概要

開発案件ごとの「ランチャー」を、Windows / macOS で動くデスクトップアプリとして提供する OSS。

- アプリ本体はビルドして配布する。使い方は2通り: ポータブル版（Windows のみ）を案件リポジトリに同梱する／各 PC にインストールする
  （→ docs/config.md「使い方」）
- 案件側はリポジトリに設定ファイル（`work.launcher` と `launcher/`）を置くだけで、
  ページ・ボタンを定義できる。個人用のローカル設定で追加・上書きもできる

## 技術スタック

Electron（雛形 electron-vite、配布 electron-builder）+ TypeScript。設定は YAML（宣言）と JS（処理）。
開発はホストで行う（devcontainer なし）。詳細は Phase 1 で詰める（→ docs/archive/phase1-overall-design/PLAN.md）。

## フォルダ構成

```
docs/        # 開発フェーズの記録（README.md が索引）
  config.md  # 設定ファイル仕様（実装の正）
  design.md  # いま有効な設計の決定と理由（トピックごと）
  knowledge.md  # 実機・OS・外部ツールで確かめた挙動（トピックごと）
  writing.md  # 日本語の文章の書き方と、画面での改行（出典つき）
  archive/   # 閉じたフェーズの当時の記録（編集しない）
src/core/      # Electron 非依存のロジック（vitest でテスト）
  i18n/        #   表示の言語と辞書（ja.ts が正、en.ts は型で揃える）
  load/        #   設定の読み込み（項目の種類の表は items.ts）
  builtinTools.ts #   Info の組み込みのツールの表（ツールを足すときはここだけ直す）
  ipc.ts       #   メイン ↔ 画面の IPC の約束（チャンネル名と型）。引数の確かめ方は ipcArgs.ts
src/main/      # Electron メインプロセス。ウィンドウごとの状態は session.ts。Info のツールの取り方は toolVersion.ts（Electron 非依存）
src/preload/   # プリロード（core/ipc.ts の約束を ipcRenderer につなぐだけ）
src/renderer/  # 画面（React）。hooks/ は App の状態、assets/styles/ は画面ごとの CSS
  help/        #   組み込みのヘルプ（Web サイトでも描く）。章は sections/<言語>/（一覧は各 index.ts）、書き方の例は examples.ts と examples.en.ts。アプリ / Web の出し分けは parts.tsx の OnlyApp・OnlyWeb
build/ resources/  # アイコン等（electron-builder 用）。アイコンの元は build/icons/*.svg（npm run icons で書き出す）
scripts/     # 開発用のスクリプト（make-icons.mjs・ビルドでライセンス一覧を作る licenses.mjs・個人情報チェック check-personal-info.mjs・ツールの取得の確認 check-tools.mjs・Release 本文を作る release-notes.mjs）
site/        # GitHub Pages のサイト（Astro）。章の本文はヘルプのものを描き、トップなど Web だけのページを足す。文言は src/i18n.ts。
             #   JS を小さくするため、アプリの icons.ts・embed.tsx をビルドで差し替える（astro.config.mjs）
examples/sample/  # 動作確認用の案件（開発中は既定でこれを開く）
mise.toml    # Node.js のバージョン固定
.claude/skills/  # phase-new / phase-close / run-app（実機を Playwright で動かす）/ handoff（Mac ⇄ Windows）/ check-tools（ツールを入れて消して取得を確かめる）
.github/changelog.yaml  # リリースノートの正（サイトのリリースノートと Release 本文の「主な変更」を作る。読み込みは src/core/changelog.ts）
.claude/settings.json  # hook（commit・push の前の個人情報チェック）
```
