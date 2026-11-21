# Phase 16: Markdown のコード表示

## 課題

- ヘルプのインラインコードがハイフンで折り返す（`--border` が「--」と「border」に分かれる）。
  Chromium はハイフンの後ろを折り返してよい位置として扱うため
- 設定の `md`（`markdown`・`mdfile`）に書いたコードブロックが単色のまま。
  Phase 15 でヘルプのコード見本だけに色を付けた（→ phase15 の PLAN.md「範囲の外」）

## 方針

- ヘルプのインラインコードは `white-space: nowrap` で折り返さない。ヘルプのインラインコードは短いものだけなので、
  はみ出す心配は小さい。設定の md のインラインコードはこれまでどおり折り返す（長いものがはみ出さないよう。GitHub と同じ）
- md のコードブロックは、react-markdown の `code` の描画で highlight.js を呼んで色を付ける。
  ヘルプの色付け（`highlight.ts`）を `components/` へ移して共通にし、core を1つにする
  - 色付けは sanitize の後の描画で行う。highlight.js の結果は中の文字をエスケープ済み
  - 言語は yaml・html・css・javascript・typescript・json・bash（shell）・powershell・bat（dos）に絞る
  - 言語を書かないブロックと、登録していない言語のブロックは色を付けない（自動判定はしない）
  - YAML のキーを緑にする規則（`.lang-yaml .hljs-attr`）を、md の `language-yaml` にも効かせる
- 配色の CSS は help.css から code.css へ移す（ヘルプ専用ではなくなるため）

### 採らなかった案

- rehype-highlight: `languages` を渡しても、実行時に既定の common（37言語）を参照するためバンドルに残る
  （画面の JS が約 320 KB 増えた。`code` の描画で色付けする形なら約 16 KB）。highlight.js の core も2つになる
- lowlight の common（37言語）: 一般的な言語は揃うが重く、案件で使う bat・PowerShell は入っていない

## 決定事項ログ

### 2026-11-16: md の言語はヘルプの5言語に json・shell・powershell・bat を足す（ユーザー決定）

- 案件の md に書きそうなのは設定・スクリプト・コマンドで、Windows の bat・PowerShell も要るため
- 使う言語だけ登録して軽く保つ。common は上の理由で採らない

### 2026-11-16: 折り返さないのはヘルプのインラインコードだけ（ユーザー決定）

- 報告のあった場所だけ直す。利用者の md の長いインラインコードは折り返したほうがはみ出さない

### 2026-11-16: rehype-highlight をやめ、`code` の描画で色を付ける

- ビルドすると rehype-highlight が common の37言語を抱え込んでいた（上の「採らなかった案」）。
  決めた言語だけで軽く保つという方針に合わせ、ヘルプの highlight.js を共通にして使う

### 2026-11-16: ヘルプの「グループとアイコン」を「レイアウトと装飾」にし、md・html・改行・見出しを移す（ユーザー決定）

- 「ボタンを追加」に、ボタンではない md・html・break・heading が入っていて不自然だった（ユーザーの指摘）
- 章の中身は、並べ方（break・heading・group・buttons）と見せ方（md・html・icon）。名前は Claude が提案した
- 早見表も分け、この章の先頭に group・buttons を含めて置く
