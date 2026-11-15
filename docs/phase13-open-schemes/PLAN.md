# Phase 13: 外部に開く URL のスキームを絞る

## 課題

URL を外部に開く経路が 4 つあり、スキームを確かめているのは 1 つだけ（2026-11 のセキュリティ確認で見つけた）。

| 経路                                   | いままでの確かめ方                                       |
| -------------------------------------- | -------------------------------------------------------- |
| 埋め込みのリンクのクリック             | `resolveLink` で http・https・mailto だけ通す            |
| 埋め込みのリンクの中クリック・`_blank` | `onClick` を通らず `setWindowOpenHandler` が素通しで開く |
| `url` 項目                             | 確かめない                                               |
| `ctx.openUrl`（scripts の JS）         | 確かめない                                               |

中クリックでは、相対リンクがアプリ自身の `file://…/out/renderer/` 起点で解決され、`file:` もそのまま
`shell.openExternal` に渡る（Windows では exe が起動しうる）。

一方で、社内の案件では `file://server/share/…` のような共有フォルダへのリンクを使いたい。

## 方針

- 開いてよいスキームを、`config.yaml` の最上位 `openSchemes` で決める。省略時は `[http, https, mailto]`
  - 書いたらその並びで置き換える（足すだけでなく、絞ることもできる）
  - `config.local.yaml` に書けば上書き（`title` と同じ）
  - 案件を開く＝信頼する、という前提（README の Security）と合う。共有の設定で広げられるが、
    その設定は exe を開く `open` 項目も書ける
- **4 つの経路すべてを、同じ 1 つの関数で確かめる**（`core/schemes.ts`。Electron に依存させない）
- `file:` を許したときは、URL をパスに直して `open` 項目と同じ処理で開く
  （無ければ「見つかりません」、Mac のフォルダは Finder）。`shell.openExternal` には渡さない
- 中クリックは画面側で `auxclick` を受け、クリックと同じ処理に回す。`setWindowOpenHandler` は何も開かずに断る
  （相対リンクが案件フォルダではなくアプリの中を指してしまうため、ここで開く理由が無い）
- `resolveLink`（画面とメインで共用）はスキームの判断をやめ、スキーム付きの URL は `external` として返す。
  判断はメインの 1 か所だけで行う
- md・html を描くときも、リンクの `href` は `openSchemes` のスキームだけ残す（→ KNOWLEDGE.md。
  サニタイザが既定で `file:` を消すため）。許可していないリンクは押しても何も起きない
- `javascript`・`vbscript`・`data` は `openSchemes` に書いてもエラーにし、常に開かない

## 決定事項ログ

### 2026-11-15: 許可リストを config.yaml の最上位に置き、すべての経路に効かせる（ユーザー決定）

- 社内では `file:` を有効にしたい場面があるため、固定のリストではなく案件ごとに決められるようにする
- 置き場所は `config.yaml` の最上位（`config.local.yaml` で上書き可）。アプリ全体の設定や、ローカル設定だけに
  置く案は、設定画面が無い・チームの全員が各自で書く手間がある、という理由で採らなかった
- `url` 項目・`ctx.openUrl` にも効かせる。リスト外ならエラーにする
- `file:` はパスに直して `open` と同じく開く（`openExternal` に渡すと、無いファイルで黙って失敗することがある）

### 2026-11-15: 描くときのリンクも openSchemes で絞り、javascript などは常に除く（実装中に判明）

- 実機で、md・html の `file:` のリンクはサニタイザが `href` を消していて、`openSchemes` に足しても開けなかった
- 描く側も `openSchemes` に合わせる。広げられるようになるので、画面の中でスクリプトになりうる
  `javascript`・`vbscript`・`data` は書けないようにした（CSP の `script-src 'self'` でも止まるが、二重に止める）
