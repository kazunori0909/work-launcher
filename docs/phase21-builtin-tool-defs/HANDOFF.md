# Phase 21 HANDOFF（Mac ⇄ Windows）

依頼と回答のやりとり（書き方は /handoff）。新しい依頼は末尾に足す。

## 2026-11-21 15:44 mac → win: git の pattern だけの上書きが「未インストール」になる

- 状態: 完了
- 関連: PLAN.md「2026-11-21: 組み込みの取り方を config.yaml で上書き」（旧形式の handoff/ から移した）

### 依頼

- 背景: Windows で config.local.yaml に `{ name: git, pattern: 'git version (\d+)' }` を書くと、git が「未インストール」と出た
  （epic の command の上書きは効いた）。`\` が `¥` になっていると疑った
- やってほしいこと: 1. pattern の文字を確かめる 2. `git --version` の出力 3. 直して確かめる
  4. ヘルプの Info の章（表・上書きの説明）が崩れていないか
- 返してほしいもの: 1〜4 の結果と原因の見立て

### 回答

- 1: `\` は U+005C で正しかった。手で書いた pattern で `version` と `(` の間の空白が抜けていた（`'git version(\d+)'`）
- 2: `git version 2.50.0.windows.2`。`/git version(\d+)/` は一致せず、`/git version (\d+)/` は `2`
- 3: 空白を足すと git は `2`。epic・node・python・Steam も値が出た
- 4: 表は9行、上書きの説明・YAML の例も崩れなし
- 原因: 打ち間違い。コードの修正は要らない
- 気づいたこと: pattern が当たらないときもコマンドは見つかっているのに「未インストール」と出て、書き間違いと区別しにくい

## 2026-11-21 16:30 mac → win: 個人情報チェックの hook が Windows でも動くか

- 状態: 依頼中

### 依頼

- 背景: commit・push の前に `scripts/check-personal-info.mjs` を動かす hook を `.claude/settings.json` に足した。
  コマンドは `node "$CLAUDE_PROJECT_DIR/scripts/check-personal-info.mjs" --hook`。
  Mac では、`git commit` を含む Bash のときだけ走り、見つかれば終了コード 2 で止まることを確かめた。
  Windows で `$CLAUDE_PROJECT_DIR` が展開されるか、スクリプトが Windows のパス（`C:\Users\…`）と
  `USERNAME` を正しく見るかは確かめていない
- やってほしいこと:
  1. `npm run check:personal` を動かし、出力を貼る（見つからなければ「見つかりませんでした」と出る）
  2. リポジトリの直下に、この PC のホームのパスを1行だけ書いた一時ファイル（例: `tmp-pi-check.txt`）を作り、
     Claude Code の Bash でそのファイルを add して commit しようとする。
     hook に止められ、コミットされないことを確かめる。確かめたら一時ファイルを消す
     （止められずにコミットされたら `git reset HEAD~1` で取り消し、ファイルを消して、そのことを回答に書く）
  3. 2 で出たメッセージを、ユーザー名を伏せ字にして貼る
- 返してほしいもの: 1〜3 の結果。止まらなかったときは、hook が走ったかどうか（`/hooks` で登録が見えるか）

### 回答

（受けた側が書く）
