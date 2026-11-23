# Phase 33: VS Code・Claude・Antigravity のツール

## 課題

Info の組み込みのツールに、エディタと AI のツール（VS Code・Claude・Antigravity）が無い。
案件で使うバージョンを揃えたいときに、`command` を自分で書く必要がある。

## 方針

- 10件を足す: アプリは `vscode`・`cursor`・`claude`（デスクトップ版）・`antigravity`・`antigravity-ide`、CLI は `claude-code`・`codex-cli`・`gemini-cli`・`copilot-cli`・`antigravity-cli`
- アプリ（`claude-code` 以外）は、アプリの「バージョン情報」に出る値を出す
  - Mac は `/Applications/<名前>.app` の Info.plist（`CFBundleShortVersionString`）を読む（Epic と同じ）。
    `code` や `antigravity-ide` は PATH に無いことが多く、`antigravity-ide --version` は元にした VS Code のバージョンを返すため
  - Windows はアンインストール情報（HKCU・HKLM・WOW6432Node）を表示名で探し、`DisplayVersion` を読む
  - Linux は取れない（steam・epic と同じ）
- CLI（`claude-code`・`codex-cli`・`gemini-cli`・`copilot-cli`・`antigravity-cli`）は `--version` の出力から取る（全 OS）

## 決定事項ログ

### 2026-11-23: Claude と Antigravity はそれぞれ2件に分ける

- Claude はデスクトップ版（Claude.app）と Claude Code の CLI を別のツールにする
- Antigravity は Antigravity.app と Antigravity IDE.app を別のツールにする（Mac に両方あり、バージョンが違う）
- ユーザーが選んだ

### 2026-11-23: Antigravity の Windows の表示名は末尾のバージョンも受ける

- Windows の表示名が `Antigravity 2.34.0` だったため（→ HANDOFF.md）。`Antigravity IDE`・`Antigravity CLI` には当たらない
- 表示名にバージョンが入るので、更新で古いキーと新しいキーが並ぶかもしれない（未確認）。
  いまは最初に見つかったものを出す。並ぶのを見たら、DisplayVersion の大きい方を取るようにする
- `Google.AntigravityCLI` は今回は足さない（→ 下の 2026-11-23 の決定で足した）

### 2026-11-23: 生成 AI の CLI と Cursor も足す

- 生成 AI のツールは増えるので、取れる範囲で入れておく（ユーザーが決めた）。Mac・Windows の両方で確かめる
- 足すもの: `cursor`・`codex-cli`・`gemini-cli`・`copilot-cli`・`antigravity-cli`
- CLI の名前は製品名に合わせて `-cli` を付ける（`gemini` だけだとアプリと紛れる）。`claude-code` は製品名のまま
- JetBrains の IDE は製品が多く入れ方で置き場所も変わるので、足さない
