# Phase 13 タスク

- [x] `core/schemes.ts`：スキームの正規化と、URL を開いてよいかの判断（テスト付き）
- [x] `openSchemes` を読む（`load`）・合成する（`merge`）。書き方の誤りは診断に出す
- [x] `resolveLink` はスキームを判断せず、スキーム付きなら `external` を返す
- [x] メインの開く処理を 1 つにまとめる（リンク・`url` 項目・`ctx.openUrl`）。`file:` はパスにして開く
- [x] 中クリック（`auxclick`）をクリックと同じに扱い、`setWindowOpenHandler` は断るだけにする
- [x] md・html を描くときも、リンクの `href` を `openSchemes` で絞る（サニタイザ・react-markdown）
- [x] run-app に中クリック（`mclick`）を足す
- [x] `docs/config.md`・アプリ内ヘルプ・README の Security に書く
- [x] 実機（Mac）で、クリック・中クリック・`url` 項目・`file:` の可否を確かめる
- [x] Windows の実機で、file: の可否を確かめる（ユーザー確認）

## 共通

- [x] 個人情報チェック（追跡ファイルに実値が混入していないか）
- [x] 実機調査で判明した挙動・制約を KNOWLEDGE.md に記録
