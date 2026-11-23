# Phase 33 HANDOFF（Mac ⇄ Windows）

依頼と回答のやりとり（書き方は /handoff）。新しい依頼は末尾に足す。

## 2026-11-23 21:55 mac → win: エディタと AI の5件のツールの取得を確かめる

- 状態: 完了
- 関連: PLAN.md「方針」、ブランチ `phase33-editor-ai-tools`

### 依頼

- 背景: Info の組み込みのツールに `vscode`・`claude`・`claude-code`・`antigravity`・`antigravity-ide` を足した（`src/core/builtinTools.ts`）。
  Windows はアンインストール情報（HKCU・HKLM・WOW6432Node）を表示名の正規表現で探し、`DisplayVersion` を読む。
  表示名は VS Code 以外は推測で、次の正規表現にしている
  - vscode: `^Microsoft Visual Studio Code( \(User\))?$`
  - claude: `^Claude$`
  - antigravity: `^Antigravity( \(User\))?$`
  - antigravity-ide: `^Antigravity IDE( \(User\))?$`
  - claude-code は `claude --version`（Mac では「2.1.330 (Claude Code)」の形）
- やってほしいこと:
  1. `git fetch && git switch phase33-editor-ai-tools && npm ci`
  2. `node scripts/check-tools.mjs vscode claude claude-code antigravity antigravity-ide` の結果を取る
  3. 入っているのに取れないもの、または各アプリの「バージョン情報」と値が違うものがあれば、実際の表示名とバージョンを PowerShell で調べる

     ```powershell
     Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*','HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*','HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*' -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -match 'Code|Claude|Antigravity' } | Select-Object DisplayName, DisplayVersion, PSChildName
     Get-AppxPackage *Claude* | Select-Object Name, Version
     ```

     Claude のデスクトップ版は、アンインストール情報に載らない入れ方（MSIX など）の可能性がある

  4. 入っていないツールは、入れられるなら winget で入れて確かめる（`/check-tools` の手順。入れる前にユーザーに確かめる）
- 返してほしいもの: ツールごとの check-tools の結果・アプリの「バージョン情報」の値・実際の表示名。
  正規表現や取り方を直した方がよければ、その案（コードは直さない）

### 回答

2026-11-23 win（Windows 11 Home）。VS Code は元から入っていた。残り4件は winget で入れて確かめ、消した（`/check-tools`）。

| ツール          | 未インストール時 | インストール（winget）  | インストール後                      | アンインストール後 |
| --------------- | ---------------- | ----------------------- | ----------------------------------- | ------------------ |
| vscode          | （元から）       | —                       | 1.108.2                             | —                  |
| claude          | 未インストール   | `Anthropic.Claude`      | 6.28899.6                           | 未インストール     |
| claude-code     | 未インストール   | `Anthropic.ClaudeCode`  | 2.1.330                             | 未インストール     |
| antigravity     | 未インストール   | `Google.Antigravity`    | **未インストール**（2.34.0 のはず） | 未インストール     |
| antigravity-ide | 未インストール   | `Google.AntigravityIDE` | 2.8.0                               | 未インストール     |

実際の表示名とバージョン（アンインストール情報。「バージョン情報」の値は exe の ProductVersion で見た）

| ツール          | DisplayName                           | DisplayVersion | ハイブ・キー                       | exe・ほか                 |
| --------------- | ------------------------------------- | -------------- | ---------------------------------- | ------------------------- |
| vscode          | `Microsoft Visual Studio Code (User)` | 1.108.2        | HKCU `{771FD6B0-…}_is1`            | `code --version` 1.108.2  |
| claude          | `Claude`                              | 6.28899.6      | HKCU `AnthropicClaude`（Squirrel） | claude.exe 6.28899.6      |
| claude-code     | `Claude Code`                         | 2.1.330        | HKCU（winget のポータブル）        | `2.1.330 (Claude Code)`   |
| antigravity     | **`Antigravity 2.34.0`**              | 2.34.0         | HKCU `121a0be4-…`                  | Antigravity.exe 2.34.0    |
| antigravity-ide | `Antigravity IDE (User)`              | 2.8.0          | HKCU `{AA73B3E3-…}_is1`            | Antigravity IDE.exe 2.8.0 |

- winget list のバージョンとも、5件すべて一致（antigravity は取れれば一致する値）
- Claude のデスクトップ版は MSIX ではなく Squirrel のインストーラで、アンインストール情報に載る（`Get-AppxPackage *Claude*` は空）
- claude-code は winget が `%LOCALAPPDATA%\Microsoft\WinGet\Links\claude.exe` にエイリアスを作る。判定もそこで見つけた
- Antigravity IDE の `resources\app\product.json` は `version` が 1.107.0（元にした VS Code）、`ideVersion` が 2.8.0。
  Mac と同じで、アンインストール情報の値（2.8.0）を読む方針で合っている
- アンインストール後、`%LOCALAPPDATA%\AnthropicClaude` に Squirrel の残り（`.dead`・`Update.exe`）が残る。
  アンインストール情報は消えるので判定には響かない

直す案（コードは直していない）

- antigravity の正規表現を、表示名の末尾のバージョンも受けるようにする（`src/core/builtinTools.ts:162`）

  ```ts
  win: winUninstallVersion('^Antigravity( \\(User\\)| \\d+(\\.\\d+)+)?$'),
  ```

  node で当てた結果: `Antigravity 2.34.0`・`Antigravity`・`Antigravity (User)` に合い、
  `Antigravity IDE (User)`・`Antigravity IDE`・`Antigravity CLI`・`Antigravity Tools 5.0.4` には合わない

- 表示名にバージョンが入るので、アップデートの仕方によっては古いキーと新しいキーが並ぶかもしれない（未確認）。
  その場合に備えるなら、合うキーが複数あったときに DisplayVersion の大きい方を取ると安全
- winget には別に `Google.AntigravityCLI`（1.5.14）もある。いまの5件には入っていない

## 2026-11-23 22:15 mac → win: Cursor と生成 AI の CLI の5件の取得を確かめる

- 状態: 依頼中
- 関連: PLAN.md「2026-11-23: 生成 AI の CLI と Cursor も足す」、前の依頼

### 依頼

- 背景: 前の依頼と同じブランチに、`cursor`・`codex-cli`・`gemini-cli`・`copilot-cli`・`antigravity-cli` を足した。
  - cursor: アンインストール情報の表示名を `^Cursor( \(User\))?$` で探す（推測）
  - CLI は `codex --version`・`gemini --version`・`copilot --version`・`agy --version` の出力から取る。
    Mac の出力は KNOWLEDGE.md の「Mac」にある
- やってほしいこと:
  1. `git pull && npm ci`
  2. `/check-tools` の手順で、5件を入れて消して確かめる（`node scripts/check-tools.mjs cursor codex-cli gemini-cli copilot-cli antigravity-cli`）。
     winget の ID は `winget search` で確かめる（候補: `Anysphere.Cursor`・`OpenAI.Codex`・`GitHub.Copilot`・`Google.AntigravityCLI`）。
     gemini-cli が winget に無ければ `npm install -g @google/gemini-cli` で入れ、`npm uninstall -g @google/gemini-cli` で消す
     （このとき npm はリポジトリの mise の node ではなく、PC に入っている node のものを使う。どちらを使ったかを書く）
  3. cursor が取れなかったら、前の依頼の PowerShell（`-match` を `'Cursor'` にする）で実際の表示名を調べる
  4. 前の依頼で直した antigravity が取れるかも、入れられるなら確かめる（`Google.Antigravity`）
- 返してほしいもの: ツールごとの4段の結果・`--version` の実際の出力・使った winget の ID。
  正規表現や取り方を直した方がよければ、その案（コードは直さない）

### 回答

（受けた側が書く）
