# Phase 12: 公開の準備（リポジトリの作り直しとセキュリティ設定）

## 課題

Ver. 0.1.0 でリポジトリを公開する。いまのリポジトリには次の問題がある。

- コミットの作者に個人のメールアドレスが入っている（公開すると見える）
- 試しに作った下書きの Release（v0.0.1〜0.0.3）・Artifacts・Actions のログ・キャッシュが残っている
- プライベートの Free プランのため、Rulesets（ブランチ・タグの保護）が使えない
- テストが走るのはタグを push したときだけ。PR で動く CI が無い
- `release.yml` はワークフロー全体に `contents: write` を付けている。アクションをタグで指定していて、SHA に固定していない

## 方針

### 履歴を捨てる

- force-push で書き換えるのではなく、**リポジトリを削除して同じ名前で作り直す**
  （force-push だと、到達できないコミットが SHA で見えたまま残り、Release・Artifacts・ログ・キャッシュも別に消す必要がある）
- 作者は GitHub の noreply アドレスにする（リポジトリの `git config user.email`）。今のツリーを 1 コミットにして push する
- push する前に、gitleaks でツリーに秘密情報が無いことを確かめる

### 運用

- 公開後は `main` に直接 push しない。ブランチを切って PR を作り、CI が通ってからマージする
- コラボレーターは今のところ足さない。自分の PR は自分で承認できないため、承認数は 0 にする（PR と CI を必須にする）

### GitHub の設定（`gh api` で入れる）

| 対象         | 設定                                                               |
| ------------ | ------------------------------------------------------------------ |
| `main`       | Ruleset で PR・CI 必須、force-push と削除を禁止。admin だけ bypass |
| タグ `v*`    | Ruleset で作成・変更・削除を禁止。admin だけ bypass                |
| Environment  | `release`。デプロイできるのはタグ `v*` だけ                        |
| Actions      | SHA 固定を必須にする。GitHub 製と指定したアクションだけ使える      |
| Actions      | 外部の人の PR はすべて承認してから動かす                           |
| Release      | Immutable releases（公開後に添付ファイル・タグを変えられない）     |
| セキュリティ | Secret scanning・Push protection・Dependabot・CodeQL・脆弱性の報告 |

### ワークフロー

- `ci.yml`：PR と `main` への push で、lint・typecheck・test を Mac と Windows で流す
- `release.yml`：権限をジョブごとに分け、`release` ジョブだけ書き込めるようにする。Environment `release` を付ける
- 配布ファイルに build provenance の attestation を付ける。署名が無いことを補うため
  （`gh attestation verify` で、このリポジトリのワークフローでビルドしたものか確かめられる）
- `dependabot.yml`：npm と github-actions を週 1 回確かめる。出てから 7 日たったものだけにする（cooldown）

### 今回はしないこと

- マージ方式を Squash だけにする、マージ後にブランチを消す、Projects を無効にする、Artifacts の保存期間を短くする、署名付きコミットを必須にする

## 決定事項ログ

### 2026-11-15: リポジトリを作り直し、Public で Ver. 0.1.0 を出す（ユーザー決定）

- 既存の履歴・Release・Artifacts は全部捨てる。作り直しのほうが確実なので、削除して作り直す
- Public にする（Free プランで Rulesets を使うため）
- 公開後は PR でマージし、管理者以外はマージできない形にする。コラボレーターは今は足さない
- 提案した設定のうち、優先度が高いもの（Rulesets・Actions・Release）と中のもの（セキュリティ機能）をやる。
  優先度が低いもの（上の「今回はしないこと」）は見送る
