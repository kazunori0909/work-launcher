# Phase 19: CI の重複をなくす

## 課題

- 1つの変更で、同じ中身を3回確かめている（v0.2.0 のリリースで確かめた）
  1. PR の CI
  2. マージ後の main への push の CI
  3. タグの Release ビルドの中の `npm test` と型チェック（`npm run build`）
- タグを打つと、2 と 3 が同時に Mac のランナーを使い、どちらも約5分待たされた

## 方針

- CI の起動条件から `push: main` を外し、PR だけで流す
  - main への直接の push は Ruleset で禁止している。Ruleset の必須チェックは
    「マージ前にブランチを main に追いつかせる」（strict）なので、PR で確かめた中身とマージ後の main は同じになる
  - これで、タグを打ったときに動くのは Release だけになり、ランナーの取り合いも起きない
- Release ビルドの `npm test` は残す。配るものを作る直前の確かめとして軽い
- CodeQL（GitHub の既定の設定で PR と main の両方で動く）は触らない
- `changes` ジョブの比較元は、PR のマージ先（`HEAD^1`）だけにする

## 決定事項ログ

### 2026-11-16: CI は PR だけで流す（ユーザー判断）

- 理由は「方針」のとおり。Ruleset の strict を外すときは、main への push の CI を戻す
