---
name: check-tools
description: Info の組み込みのツールが実機で取れるかを、未インストール → インストール → インストール後 → アンインストールの順に確かめる。Mac は Homebrew、Windows は winget で入れて消し、判定は scripts/check-tools.mjs（アプリと同じ判定）で見る。「ツールの取得を確かめて」「check-tools を回して」のときに使う。
---

# 組み込みのツールの取得を確かめる

## 判定の道具

```sh
node scripts/check-tools.mjs ruby go rust php        # 表で出す
node scripts/check-tools.mjs ruby --json             # status: installed / missing / mismatch / unsupported
```

- アプリを起動せずに Info と同じ判定（`src/main/toolVersion.ts`）を動かす
- PATH はアプリを新しく起動したときと同じにする（Mac はログインシェル、Windows はレジストリの Machine + User）。
  なので Windows でインストール後にターミナルを開き直さなくてよい
- 最後の列は、コマンドが見つかった場所（判定がおかしいときの手がかり）

## 手順

対象は引数で受ける（省略時はユーザーに聞く）。1ツールずつ、次の4段を回す。

0. **元の状態を控える**。判定が `installed` なら、開発者が使っているものなので**入れる・消すを飛ばし**、
   「元から入っている（バージョン）」とだけ報告する（Mac の ruby の `/usr/bin/ruby` のように OS に付いているものも同じ）
1. **未インストール時**: `missing` になるか
2. **インストール**: 下の表のコマンドで入れる
   - Mac は先に `brew list --formula > <scratchpad>/before.txt` を取っておく（依存も入るため）
   - Windows は UAC の確認が出ることがある。出たらユーザーに押してもらうよう伝えて待つ
     （管理者に昇格したシェルでは、4つとも出なかった）
3. **インストール後**: `installed` で、バージョンがパッケージマネージャの言うバージョンと合うか
   （Mac は `brew info --json=v2 <名前>`、Windows は `winget list --id <ID>`。
   rust は winget が rustup 自身のバージョンを出すので、`Rustlang.Rust.MSVC` の行と比べる）
4. **アンインストール**: 消して、`missing` に戻るか
   - Mac は `brew list --formula` と before.txt の差分（増えた分）だけを消し、元の一覧に戻ったかを `diff` で見る。
     `brew autoremove` は使わない（元からあった不要な依存まで消える）。
     差分は `comm -13 before.txt after.txt | xargs brew uninstall` で渡す（zsh は変数の改行で引数を分けない）
   - Windows は `winget uninstall --id <ID> --silent`。php（ポータブルの zip）は、winget が User PATH に足した
     `%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.…` の行が消したあとも残る（判定には響かない）

Mac の Homebrew は `HOMEBREW_NO_AUTO_UPDATE=1` を付けて動かす（他のパッケージを巻き込んで更新しない）。

## 入れ方の表

| 名前            | Mac（Homebrew）                          | Windows（winget の ID）      |
| --------------- | ---------------------------------------- | ---------------------------- |
| ruby            | `brew install ruby`                      | `RubyInstallerTeam.Ruby.3.4` |
| go              | `brew install go`                        | `GoLang.Go`                  |
| rust            | 下の注を見る                             | `Rustlang.Rustup`            |
| php             | `brew install php`                       | `PHP.PHP.8.4`                |
| vscode          | `brew install --cask visual-studio-code` | `Microsoft.VisualStudioCode` |
| cursor          | `brew install --cask cursor`             | `Anysphere.Cursor`           |
| claude          | `brew install --cask claude`             | `Anthropic.Claude`           |
| claude-code     | `brew install --cask claude-code`        | `Anthropic.ClaudeCode`       |
| codex-cli       | `brew install --cask codex`              | `OpenAI.Codex`               |
| gemini-cli      | `brew install gemini-cli`（下の注）      | 無い（下の注）               |
| copilot-cli     | `brew install --cask copilot-cli`        | `GitHub.Copilot`             |
| antigravity     | `brew install --cask antigravity`        | `Google.Antigravity`         |
| antigravity-ide | `brew install --cask antigravity-ide`    | `Google.AntigravityIDE`      |
| antigravity-cli | `brew install --cask antigravity-cli`    | `Google.AntigravityCLI`      |

- gemini-cli: Mac の Homebrew は node に依存し、入れると Homebrew の node が上がる（消しても戻らない）。入れる前にユーザーに伝える。
  Windows は winget に無いので、PC の node の npm で `npm install -g @google/gemini-cli`（消すのは `npm uninstall -g`）。
  PC に node が無ければ、`OpenJS.NodeJS.LTS` を一時的に入れるかユーザーに聞く
- アプリ（vscode・cursor・claude・antigravity・antigravity-ide）は、元から入っていることが多い。0 の段で `installed` なら飛ばす
- winget の ID は変わることがある。入れる前に `winget search <名前>` で確かめ、違えば表を直す
- Windows は `winget install --id <ID> --exact --silent --accept-package-agreements --accept-source-agreements` で入れる
- Mac の rust: Homebrew の `rust` は llvm を連れてきて大きい。rustup の公式インストーラ
  （`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y`、消すのは `rustup self uninstall -y`）は
  シェルの設定ファイルに PATH の行を足すので、どちらで入れるかはユーザーに聞く。
  rustup で入れるときは、先にホームの `.profile`・`.zshenv` などがあるかを控え、消したあとに比べる
  （`~/.cargo/bin/rustup self uninstall -y` とフルパスで呼ぶ。rustup が作ったファイルは空で残るので、元に無ければ消す）

## 報告

ツールごとに4段の結果を表にする（期待と違ったら太字）。

| ツール | 未インストール時 | インストール | インストール後 | アンインストール後 |
| ------ | ---------------- | ------------ | -------------- | ------------------ |

- 期待と違う結果は、原因（コマンドの出力・見つかった場所）まで調べ、進行中フェーズの KNOWLEDGE.md に書く
- Windows で回したときは、結果を HANDOFF.md の回答に書く（`/handoff`）
- 画面でも確かめるときは `/run-app`。Windows ではいまのシェルの PATH を引き継ぐので、run-app の「注意」に従ってレジストリの PATH を渡す
