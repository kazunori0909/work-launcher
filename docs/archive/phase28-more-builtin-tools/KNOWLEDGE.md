# Phase 28 KNOWLEDGE

## Mac（2026-11-22、macOS 26.6、Homebrew）

| ツール | 未インストール時 | インストール   | インストール後 | アンインストール後 |
| ------ | ---------------- | -------------- | -------------- | ------------------ |
| go     | 未インストール   | `brew install` | 1.27.4         | 未インストール     |
| ruby   | 2.6.10p210（OS） | `brew install` | 2.6.10p210 ※1  | 2.6.10p210（OS）   |
| rust   | 未インストール   | rustup 公式    | 1.100.0        | 未インストール     |
| php    | 元から入っている | 飛ばした       | 8.5.5          | 飛ばした           |

- 実機の Info 画面も `scripts/check-tools.mjs` と同じ値を出した
- ※1 Homebrew の ruby（4.0.9）は keg-only ではなく `/opt/homebrew/bin/ruby` に入るが、
  ログインシェルの PATH で `/opt/homebrew/bin` が `/usr/bin` より後ろにあると `/usr/bin/ruby` が先に見つかる。
  ターミナルの `ruby --version` と同じ値なので、アプリの判定としては正しい（brew も入れたときに警告を出す）
- Mac の `/usr/bin/ruby` はスタブではなく本物（2.6 系）。Mac では ruby の「未インストール」は出ない
- Homebrew の ruby は libyaml・openssl@4 を連れてくる。rust は llvm を連れてくる（大きい）
- rustup 公式（`-y`）は zsh では `~/.zshenv` と `~/.profile` に `. "$HOME/.cargo/env"` を足す（無ければ作る）。
  ログインシェルの PATH に `~/.cargo/bin` が入るので、アプリを起動し直せば取れる
- `rustup self uninstall -y` は `~/.cargo`・`~/.rustup` と足した行を消すが、自分で作ったファイルは空のまま残す。
  また `~/.cargo/bin` がいまのシェルの PATH に無いと `rustup` が見つからないので、フルパスで呼ぶ

## Windows（2026-11-22、Windows 11 25H2、winget）

| ツール | 未インストール時 | インストール                 | インストール後 | アンインストール後 |
| ------ | ---------------- | ---------------------------- | -------------- | ------------------ |
| go     | 未インストール   | `GoLang.Go`                  | 1.27.4         | 未インストール     |
| ruby   | 未インストール   | `RubyInstallerTeam.Ruby.3.4` | 3.4.13         | 未インストール     |
| php    | 未インストール   | `PHP.PHP.8.4`                | 8.4.28         | 未インストール     |
| rust   | 未インストール   | `Rustlang.Rustup`            | 1.100.0        | 未インストール     |

- 実機の Info 画面も、レジストリの PATH で起動すれば `scripts/check-tools.mjs` と同じ値を出した
- アプリは起動したときの PATH を使い続ける。インストールより前に開いたシェルから起動すると「未インストール」のまま。
  エクスプローラーから新しく起動すれば更新後の PATH を受け取るので、利用者はアプリを起動し直せばよい
- php（winget のポータブル）は、アンインストール後も User PATH に winget が足した行が残る（フォルダは消える）。
  ruby・rust は PATH の行も消えた
- winget は rust のバージョンとして rustup 自身（1.29.3）を出す。rustc は `Rustlang.Rust.MSVC` の行に出る
- UAC は4つとも出なかった（管理者に昇格したシェルで確かめたので、通常のシェルでも出ないとは言えない）
