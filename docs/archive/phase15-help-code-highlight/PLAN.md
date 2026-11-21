# Phase 15: ヘルプのコードに色を付ける

## 課題

- ヘルプのコード見本（`Code`・見本・早見表の YAML）が単色で、キーと値やコメントの区別がつきにくい
- 対象はヘルプの中のコードだけ。言語は yaml・html・css・javascript・typescript

## 方針

- highlight.js の core に、使う言語（yaml・xml・css・javascript・typescript）だけを登録する。
  同期で色付けでき、React の描画にそのまま組み込める
- 配色は既製のテーマを使わず、`hljs-*` のクラスごとに CSS 変数（`--code-*`）で数色を決める。
  アプリの配色に合わせて GitHub に近い色にする。YAML のキーだけは緑にする
  （highlight.js はキーも CSS のプロパティも `hljs-attr` で、青のままだとライトで値の紺と見分けにくい）
- `Code` に `lang` を足す。見本・早見表の `yaml` は常に yaml。言語を書かないものは色を付けない
  （フォルダ構成の図など）
- YAML と CSS が1つのブロックに混ざっている見本（タイトルと見た目）は2つに分ける

### 採らなかった案

- Shiki: 見た目はよいが、文法の読み込みが非同期で、文法とテーマのぶん重い
- Prism: グローバル前提の作りで、v2 の開発が止まっている

### 範囲の外

- 設定の `md` に書いたコードブロックの色付け。やるなら rehype-highlight を足す
  （中身は同じ highlight.js なので、このフェーズの配色 CSS を使い回せる）

## 決定事項ログ

### 2026-11-16: highlight.js で、ヘルプの中だけに色を付ける

- 対象はヘルプのコード見本だけ（ユーザーの指定）。言語は yaml・html・css・javascript・typescript
- ライブラリは highlight.js の core と5言語。Shiki・Prism は上の理由で採らない（提案をユーザーが了承）
