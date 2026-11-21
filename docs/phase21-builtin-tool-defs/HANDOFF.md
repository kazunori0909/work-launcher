# Phase 21 HANDOFF（Mac ⇄ Windows）

依頼と回答のやりとり（書き方は /handoff）。新しい依頼は末尾に足す。

## 2026-11-21 16:30 mac → win: 個人情報チェックの hook が Windows でも動くか

- 状態: 依頼中
- 関連: handoff/20261121-1544-mac-to-win-git-pattern.md（旧形式の依頼。回答が届いたらこのファイルへ移す）

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
