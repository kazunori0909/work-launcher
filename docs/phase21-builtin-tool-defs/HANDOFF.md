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

- 状態: 完了

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

- 1: `npm run check:personal` は「個人情報らしい文字列は見つかりませんでした」
- 2: Claude Code の Bash で `git add tmp-pi-check.txt && git commit …` を実行すると、hook に止められた。
  コマンド全体が実行されないので、add もされていない。HEAD は変わらず、一時ファイルは消した。
  `$CLAUDE_PROJECT_DIR` は展開された（hook は Git Bash で動いた）。Windows のパスと `USERNAME` も検出できた
- 3: メッセージ（ユーザー名は `<ユーザー名>` に伏せた）

  ```
  個人情報らしい文字列が見つかりました。直してから commit・push してください
  （パスは ~ や %USERPROFILE% に、名前は伏せ字に置き換える。意図して載せる行は personal-info:allow を付ける）
  - tmp-pi-check.txt:1: この PC のユーザー名: C:\Users\<ユーザー名>
  - tmp-pi-check.txt:1: この PC のユーザー名: C:\Users\<ユーザー名>
  - tmp-pi-check.txt:1: ホームのパス: C:\Users\<ユーザー名>
  ```

- 気づいたこと（直すかは Mac 側で判断してほしい）
  - **PowerShell ツールでは hook が走らない。** matcher が `Bash` だけのため。Windows の Claude Code は
    git を PowerShell ツールで動かすことが多い（この回答の前の commit・push も PowerShell だった）。
    `"git commit"` を含む文字列を出すだけの PowerShell のコマンドは、未追跡の一時ファイルがあっても止まらずに通った。
    matcher を `Bash|PowerShell` にすれば足りそう（tool_input.command の形は同じはず。未確認）
  - 「この PC のユーザー名」が2行出る。`os.userInfo().username` と `USERNAME` が同じ値で、needle が重複している
  - この PC のユーザー名は Windows の既定の管理者アカウント名。GENERIC に無いので、
    その単語をドキュメントに一般名詞として書いても止まる（今回は実際の名前なので止まって正しい）

## 2026-11-21 17:30 mac → win: PowerShell ツールでも個人情報チェックの hook が走るか

- 状態: 依頼中
- 関連: 「16:30 mac → win: 個人情報チェックの hook が Windows でも動くか」の気づいたこと

### 依頼

- 背景: hook の matcher を `Bash` から `Bash|PowerShell` に変えた（`.claude/settings.json`）。
  PowerShell ツールの `tool_input.command` が Bash と同じ形かは確かめていない。
  あわせて、同じ行・同じ種類の検出は1行にまとめた
- やってほしいこと:
  1. `git pull` のあと Claude Code を開き直し、`/hooks` で PreToolUse に `Bash|PowerShell` が見えるか確かめる
  2. 前回と同じく、ホームのパスを1行書いた一時ファイルを作り、**PowerShell ツールで** add して commit しようとする。
     止められ、コミットされないことを確かめる（コミットされたら `git reset HEAD~1` で取り消す）。確かめたら一時ファイルを消す
  3. 2 のメッセージで「この PC のユーザー名」が1行だけになっているか
- 返してほしいもの: 1〜3 の結果（メッセージはユーザー名を伏せ字に）。止まらなかったときは、hook に渡る入力の形が分かれば書く

### 回答

（受けた側が書く）
