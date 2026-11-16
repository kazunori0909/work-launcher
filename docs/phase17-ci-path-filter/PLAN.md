# Phase 17: CI の絞り込み

## 課題

- README・docs などビルドに関係しない変更だけの PR でも、Mac と Windows の lint・typecheck・test が流れる
- 絞りすぎて、本来流すべき変更で CI が動かなくなることは避けたい

## 方針

### 判定のしかた

- ワークフローは毎回起動し、先頭の `changes` ジョブが変更ファイルから「流すか」を決める
  - 案: `on:` の `paths-ignore` は採らない。起動しないと必須チェックが「Expected」のまま残り、マージできなくなるため
  - 案: `check` ジョブに `if:` だけ付ける方法は採らない。飛ばした matrix のジョブは `check (${{ matrix.os }})` の名前で記録され、必須チェックと名前が合わないため
  - 変更ファイルは `git diff --name-only` で取る。サードパーティの action（`dorny/paths-filter` など）は依存を増やすので使わない
- **除外リスト方式**にする。リストに当たらないファイルが1つでもあれば流す（新しいファイル・フォルダは自動で対象になる）
  - diff が取れないとき（比較元が無い・取得に失敗）も流す
- 除外するもの: `docs/`・ルートの `README.md` `AGENTS.md` `CLAUDE.md` `SECURITY.md`・`.claude/`・`.vscode/`・
  `.github/release-notes.md`・`.github/dependabot.yml`
  - `**/*.md` のように広くは除かない。`examples/sample` の md はテストで読む。`LICENSE` はアプリに同梱する

### 必須チェック

- 結果をまとめる `ci-ok` ジョブを置き、Ruleset の必須チェックをこれ1つにする
  - `check` が成功か飛ばしなら通し、失敗・キャンセルなら落とす
  - matrix に OS を足しても Ruleset を直さなくて済む
- 切り替えの順: PR で `ci-ok` が出るのを確かめる → Ruleset を差し替える → マージ
  （`pull_request` は PR 側のワークフローで動くので、この順なら止まらない）

## 決定事項ログ

### 2026-11-16: 署名はまだ入れない（ユーザー判断）

- 使う人がいないうちは SignPath Foundation の審査に通りにくい。「次に扱う候補」へ移した（→ phase8）

### 2026-11-16: 除外リスト方式で CI を絞り、必須チェックを `ci-ok` 1つにする（ユーザー判断）

- 理由は「方針」のとおり。main への push にも同じ判定を使う
