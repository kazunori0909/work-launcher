# Phase 12 タスク

## 手元の準備

- [x] `package.json` のバージョンを 0.1.0 にする
- [x] `ci.yml` を足す（lint・typecheck・test を Mac と Windows で流す）
- [x] `release.yml` の権限をジョブごとに分け、アクションを SHA に固定し、attestation を付ける
- [x] `dependabot.yml`・`SECURITY.md` を足す
- [x] README・リリースノートに、PR の運用と attestation の確かめ方を書く
- [x] gitleaks でツリーに秘密情報が無いことを確かめる
- [x] 作者を noreply アドレスにして、1 コミットにまとめる

## 作り直し（元に戻せない。直前にユーザーに確認する）

- [x] 今のリポジトリを削除する
- [x] Public で作り直して push する

## GitHub の設定

- [x] `main` の Ruleset
- [x] タグ `v*` の Ruleset
- [x] Environment `release`
- [x] Actions（SHA 固定の必須、使えるアクション、外部の人の PR の承認）
- [x] Immutable releases
- [x] Secret scanning・Push protection・Dependabot alerts / security updates・CodeQL・Private vulnerability reporting
      （non-provider patterns と validity checks は、API で有効にしても disabled のまま。GitHub Secret Protection が要る）
- [x] GitHub の Email 設定（Keep my email addresses private・Block command line pushes。ユーザーが画面で行う）

## 確かめる

- [ ] PR を作ると CI が走り、通るまでマージできない
- [ ] `v0.1.0` のタグで下書きの Release ができ、`gh attestation verify` が通る

## 共通

- [x] 個人情報チェック（追跡ファイルに実値が混入していないか）
