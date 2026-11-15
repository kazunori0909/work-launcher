# Phase 5: 起動用ファイルと設定の分離

## 課題

- 設定を `work.launcher` に YAML で書いているため、VS Code などのエディタは YAML と認識しない。
  利用者が案件ごとに `files.associations` を書く必要があり、OSS として配る際の手間になる
- 拡張子 `.launcher` は、ダブルクリックでアプリを起動するための関連付けに要る（→ Phase 1）。
  `.yaml` にすると関連付けられない（`work.launcher.yaml` も、OS は最後の拡張子しか見ない）

## 方針

```
<案件リポジトリ>/
  work.launcher              ← 起動用。中身は読まない（ダブルクリックの入口・案件ルートの目印）
  .launcher/
    config.yaml              ← 案件の設定（旧 work.launcher の中身）
    config.local.yaml        ← 個人用（旧 work.local.launcher）
```

- 設定は `.yaml` なので、どのエディタでも設定なしで YAML として扱われる
- `${projectDir}` は `work.launcher` があるフォルダのまま。設定の相対パスも `${projectDir}` 起点のまま
- 案: 拡張子 `.launcher` をやめて `.yaml` にする → ダブルクリック起動ができなくなるため採らない
- 案: VS Code の `files.associations` を案内する（いまのやり方）→ 利用者の手間が残るため採らない

## 決定事項ログ

### 2026-11-14: 起動用ファイルと設定を分ける（ユーザー判断）

- `work.launcher` は起動用にし、設定は `.launcher/config.yaml` に移す
- 個人用は `.launcher/config.local.yaml`。console.local.yaml と同じ場所・同じ命名にそろえる
- 置き場所を `.launcher/` にしたのは、ほかの設定ファイル（pages・scripts・console・style）が
  すでにそこにあるため（Claude 提案）

### 2026-11-14: 相対パスの起点と work.launcher の中身（Claude 提案）

- 設定の相対パスは、config.yaml が `.launcher/` に移っても `${projectDir}` 起点のまま。
  include 先と同じく「どのファイルに書いたかによらない」規則を保つ
- `work.launcher` の中身は読まない。空でよく、サンプルには説明のコメントを1行置く
- スキーマの自動適用（SchemaStore への登録）は、JSON Schema を作るときに行う
