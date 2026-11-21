# Phase 28 HANDOFF（Mac ⇄ Windows）

依頼と回答のやりとり（書き方は /handoff）。新しい依頼は末尾に足す。

## 2026-11-22 02:25 mac → win: ruby・go・rust・php の取得を入れて消して確かめる

- 状態: 依頼中
- 関連: PLAN.md「方針」、KNOWLEDGE.md「Mac」（Mac の結果）

### 依頼

- 背景: Info の組み込みのツールに ruby・go・rust・php を足した（`src/core/builtinTools.ts`）。
  アプリを起動せずに Info と同じ判定を動かす `scripts/check-tools.mjs` と、
  入れる・確かめる・消すの手順のスキル `/check-tools` を作った。Mac では4つとも回した
- やってほしいこと:
  1. ブランチ `phase28-more-builtin-tools` を pull して `npm ci`
  2. `/check-tools` を ruby・go・rust・php で回す（入れ方の表は SKILL.md。winget の ID が違えば SKILL.md の表を直してよい）。
     元から入っているものは入れる・消すを飛ばす
  3. それぞれのインストール後（消す前）に、`/run-app` で `examples/sample` の Info タブの「ツール」の枠の文字も取る。
     run-app はいまのシェルの PATH を引き継ぐので、`check-tools.mjs`（レジストリの PATH）と違う値になったら、その違いも書く
  4. UAC の確認が出たツールがあれば、どれかを書く
- 返してほしいもの:
  - ツールごとの4段の表（未インストール時・インストール・インストール後・アンインストール後）と、
    Info 画面の値
  - 期待と違った結果の原因（コマンドの出力・`where` で見つかった場所）
  - 直した方がよいと思うこと（コードは直さず、書くだけ）

### 回答

（受けた側が書く）
