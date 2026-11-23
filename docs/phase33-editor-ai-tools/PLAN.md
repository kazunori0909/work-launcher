# Phase 33: VS Code・Claude・Antigravity のツール

## 課題

Info の組み込みのツールに、エディタと AI のツール（VS Code・Claude・Antigravity）が無い。
案件で使うバージョンを揃えたいときに、`command` を自分で書く必要がある。

## 方針

- 5件を足す: `vscode`・`claude`（デスクトップ版）・`claude-code`（CLI）・`antigravity`・`antigravity-ide`
- アプリ（`claude-code` 以外）は、アプリの「バージョン情報」に出る値を出す
  - Mac は `/Applications/<名前>.app` の Info.plist（`CFBundleShortVersionString`）を読む（Epic と同じ）。
    `code` や `antigravity-ide` は PATH に無いことが多く、`antigravity-ide --version` は元にした VS Code のバージョンを返すため
  - Windows はアンインストール情報（HKCU・HKLM・WOW6432Node）を表示名で探し、`DisplayVersion` を読む
  - Linux は取れない（steam・epic と同じ）
- `claude-code` は `claude --version` の先頭のバージョンを出す（全 OS）

## 決定事項ログ

### 2026-11-23: Claude と Antigravity はそれぞれ2件に分ける

- Claude はデスクトップ版（Claude.app）と Claude Code の CLI を別のツールにする
- Antigravity は Antigravity.app と Antigravity IDE.app を別のツールにする（Mac に両方あり、バージョンが違う）
- ユーザーが選んだ
