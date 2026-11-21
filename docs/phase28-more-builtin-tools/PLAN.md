# Phase 28: 組み込みのツールを増やす

## 課題

- Info の組み込みのツールに ruby・go・rust・php が無く、案件ごとに `command` を書く必要がある
- 新しいツールのバージョンが実機で本当に取れるか（未インストール → インストール → インストール後 → アンインストール）を、
  Windows・Mac の両方で手で確かめるのはつらい

## 方針

- `BUILTIN_TOOLS` に ruby・go・rust・php を足す（取り方は下の表）
- Info のツールの取り方（`src/main/info.ts` の一部）を Electron に依存しないファイルへ分け、
  アプリを起動せずに同じ判定を動かすスクリプト `scripts/check-tools.mjs` を作る（vite の `runnerImport` で TS を読む）
  - Mac はアプリと同じくログインシェルの PATH を読む
  - Windows はレジストリの PATH（Machine + User）を読み直す（インストール後に起動したアプリと同じ PATH にする）
- 入れる・確かめる・消すの手順はスキル `/check-tools` にまとめ、Mac と Windows の Claude が同じ手順で回す
  （Windows には `/handoff` で頼む）
  - 元から入っているツールは入れる・消すを飛ばす（開発者の環境を壊さない）
  - Mac の Homebrew は、入れる前の `brew list` を控え、増えた分だけを消す（rust は llvm などを連れてくる）

| 名前 | コマンド          | pattern       |
| ---- | ----------------- | ------------- |
| ruby | `ruby --version`  | `ruby (\S+)`  |
| go   | `go version`      | `go(\d\S*)`   |
| rust | `rustc --version` | `rustc (\S+)` |
| php  | `php --version`   | `PHP (\S+)`   |

## 決定事項ログ

### 2026-11-22: 足すツールは ruby・go・rust・php

- 言語のランタイムで利用者が多いもの。pnpm・bun・Unity Hub などは後に回す（→ docs/README.md「次に扱う候補」）

### 2026-11-22: 確認は Claude に回させる

- Mac・Windows それぞれで、未インストール → インストール → インストール後 → アンインストールを Claude が回して結果を表で出す
