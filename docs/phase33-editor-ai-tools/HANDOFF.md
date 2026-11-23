# Phase 33 HANDOFF（Mac ⇄ Windows）

依頼と回答のやりとり（書き方は /handoff）。新しい依頼は末尾に足す。

## 2026-11-23 21:55 mac → win: エディタと AI の5件のツールの取得を確かめる

- 状態: 依頼中
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

（受けた側が書く）
