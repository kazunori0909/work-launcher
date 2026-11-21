# Phase 18 で確かめた挙動

## Windows の `ctx.bat` の stdout にはエコーが入る（2026-11-16、Windows 11）

- `cmd.exe /d /c <一時ファイル.bat>` で動かすため、通常の .bat と同じくプロンプトと実行したコマンドが stdout に出る。
  `console: false` でも結果の `stdout` には入る
  - 例: `ctx.bat('echo hidden', { console: false })` の stdout は `\r\n<フォルダ>>echo hidden \r\nhidden`
- 出力を読む用途では、先頭に `@echo off` を書く（1行だけなら `@cd` のように `@` を付ける）。
  `@echo off` を付けると stdout は `hidden` だけになった
- 仕様（docs/config.md 3.2「`bat` は … 実行したコマンドも表示される」）どおりの挙動

## バッククォートの先頭の改行は、コンソールの見出しで空のプロンプト行になる

- ``ctx.bat(`\necho a\n`)`` と書くと、本文の1行目が空なので、見出しは `C:\work> ` のあとに `> echo a` が続く
- bat の場合は、空行のエコーとして stdout の先頭にもプロンプト行が入る

## その他（Windows 11 で期待どおりだったもの）

- bat の日本語（cp932）・終了コード・stderr、`wait: false`、powershell・python・sh（Git Bash）の日本語
- `cwd` 省略時は関数の作業フォルダ（`ctx.workDir` と一致）
- `ctx.excel(..., { readonly: true })` は `EXCEL.EXE /r` で起動し、タイトルに「[読み取り専用]」が出る
- run-app スキルのドライバは Windows でもそのまま動いた
