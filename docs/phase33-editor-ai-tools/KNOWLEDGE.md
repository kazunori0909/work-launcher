# Phase 33 で確かめた挙動

## Mac（2026-11）

- `/Applications` に `Antigravity.app`（`com.google.antigravity`）と `Antigravity IDE.app`（`com.google.antigravity-ide`）が別にある。
  バージョンも別（2.0.x と 2.7.x）
- `Antigravity IDE.app` 同梱の `antigravity-ide --version` は、アプリのバージョンではなく元にした VS Code のバージョン（1.107.0）を返す
- `Antigravity.app` には `bin/` の CLI が無い
- VS Code の `code` は、シェルコマンドを入れるまで PATH に無い。Info.plist の値と `code --version` の1行目は同じ
- Claude.app は `CFBundleShortVersionString` と `CFBundleVersion` が同じ値
- VS Code の Claude Code 拡張だけを入れた状態では、`claude` は PATH に無い（`claude-code` は「未インストール」になる）
