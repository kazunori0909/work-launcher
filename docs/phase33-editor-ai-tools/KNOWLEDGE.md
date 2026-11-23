# Phase 33 で確かめた挙動

## Mac（2026-11）

- `/Applications` に `Antigravity.app`（`com.google.antigravity`）と `Antigravity IDE.app`（`com.google.antigravity-ide`）が別にある。
  バージョンも別（2.0.x と 2.7.x）
- `Antigravity IDE.app` 同梱の `antigravity-ide --version` は、アプリのバージョンではなく元にした VS Code のバージョン（1.107.0）を返す
- `Antigravity.app` には `bin/` の CLI が無い
- VS Code の `code` は、シェルコマンドを入れるまで PATH に無い。Info.plist の値と `code --version` の1行目は同じ
- Claude.app は `CFBundleShortVersionString` と `CFBundleVersion` が同じ値
- VS Code の Claude Code 拡張だけを入れた状態では、`claude` は PATH に無い（`claude-code` は「未インストール」になる）

## Windows（2026-11、Windows 11。winget で入れて確かめた）

- アンインストール情報（どれも HKCU）の表示名は次のとおり。`DisplayVersion` はアプリの exe の ProductVersion と同じ
  - VS Code: `Microsoft Visual Studio Code (User)`
  - Claude: `Claude`（Squirrel のインストーラ。MSIX ではない）
  - Antigravity: `Antigravity 2.34.0`（表示名の末尾にバージョンが付く）
  - Antigravity IDE: `Antigravity IDE (User)`
- winget の ID: `Anthropic.Claude`・`Anthropic.ClaudeCode`・`Google.Antigravity`・`Google.AntigravityIDE`
- winget の Claude Code は `%LOCALAPPDATA%\Microsoft\WinGet\Links\claude.exe` にエイリアスを作る。`claude --version` は Mac と同じ形
- Antigravity IDE の `resources\app\product.json` は `version` が元にした VS Code のバージョン、`ideVersion` がアプリのバージョン（Mac と同じ）
- Claude をアンインストールしたあと、`%LOCALAPPDATA%\AnthropicClaude` に Squirrel の残りがある。アンインストール情報は消えるので判定には響かない
