# Phase 6 タスク

## 準備

- [x] Windows 実機に Node.js（mise）を入れ、clone して `npm run dev` でサンプルが開くことを確かめる

## excel・powerpoint

- [x] Windows での開き方を決める（`/r` の渡し方・Excel/PowerPoint の探し方・PowerPoint の読み取り専用）
- [x] Mac での開き方を決める（`readonly` は無視。Office が無ければ既定のアプリ）
- [x] 開く処理を作る（コマンドの組み立ては src/core に置き、単体テスト付き）
- [x] 確認用の xlsx・pptx と項目をサンプルに足す（ツールのページの「Office」）
- [x] Mac で確かめる（Office が無いときに既定のアプリで開く・ファイルが無いときのエラー。ユーザー確認）
- [x] Windows で確かめる（readonly あり・なしの Excel・PowerPoint。ユーザー確認）
- [x] Word を足す（readonly は COM。確認用の docx をサンプルに置く）
- [x] Windows で Word を確かめる（readonly。ユーザー確認）

## Phase 2 の持ち越し（Windows 実機）

- [x] bat の実行と出力（cp932 が文字化けしない。ユーザー確認）
- [x] bat の入力待ち（`pause` などで止まらないか）と停止ボタン（ポータブル版。ユーザー確認）
- [x] `sh` を Git Bash で実行する（Git Bash の探し方。ユーザー確認）
- [x] PowerShell の実行（5.1 で日本語の本文・出力が化けないよう直した。単体テスト付き）
- [x] Python の実行で、Store のスタブに当たったら分かるように出す（py を先に試す）
- [x] Python が入った PC で実行を確かめる（Python 3.14 を入れて確認。出力が cp932 で化けたので PYTHONIOENCODING を渡すよう直した）
- [x] Info のツールの python も py を先に試す（サンプルの tools に python を足す）

## Info ページ

- [x] Windows での取り方を決める（OS・CPU・メモリ・GPU のドライバー・ドライブ・IP）
- [x] 出力の読み取り（単体テスト付き）と集める処理を作る
- [x] 実機で見て確かめる（ユーザー確認）

## 配布ビルド

- [x] `npm run build:win` でインストーラーとポータブル exe を作る
- [x] 案件の指定が無ければ、アプリ（ポータブル版は元の exe）と同じフォルダの `work.launcher` を開く
- [x] ポータブル exe をサンプルと同じフォルダに置き、ダブルクリックでサンプルが開くことを確かめる
- [x] インストーラーで入れて、`work.launcher` を引数に渡して開く（別アカウント。ユーザー確認）
- [x] 配布版で PATH の違いが問題にならないか見る（ポータブル版の Info でツールのバージョンが取れる。ユーザー確認）

## 共通

- [x] ヘルプと docs/config.md を実装に合わせて直す
- [x] 実機調査で判明した挙動・制約を KNOWLEDGE.md に記録
- [x] 個人情報チェック（追跡ファイルに実値が混入していないか。テストの IP を文書用のアドレスに置き換えた）
