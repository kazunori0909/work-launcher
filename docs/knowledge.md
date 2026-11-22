# 実機で確かめた挙動

**いまも当てはまる、実機・OS・外部ツールの挙動と制約。** 全文は読まず、見出しで検索して節だけ読む。

- 決定の理由は [design.md](design.md) に書く。ここには確かめた事実だけを書く
- 当てはまらなくなったら（ツールの更新など）、追記ではなく書き換えるか消す
- 実測値・手順の詳細は archive に残し、ここからはリンクで指す。各項目の末尾に
  `（由来: [Phase N](archive/phase<N>-<slug>/KNOWLEDGE.md)）` を付ける

## Electron

## macOS

- `/usr/bin/ruby` はスタブではなく本物（2.6 系）。Mac では ruby の「未インストール」は出ない（由来: [Phase 28](archive/phase28-more-builtin-tools/KNOWLEDGE.md)）
- ログインシェルの PATH で Homebrew の bin が `/usr/bin` より後ろにあると、Homebrew で ruby を入れても
  `/usr/bin/ruby` が先に見つかる（ターミナルの `ruby --version` と同じ値）（由来: [Phase 28](archive/phase28-more-builtin-tools/KNOWLEDGE.md)）
- `rustup self uninstall -y` は、自分で作った `~/.zshenv`・`~/.profile` を空のまま残す。
  `~/.cargo/bin` がいまのシェルの PATH に無いと `rustup` が見つからないので、フルパスで呼ぶ（由来: [Phase 28](archive/phase28-more-builtin-tools/KNOWLEDGE.md)）

## Windows

- アプリは起動したときの PATH を使い続ける。インストール後のツールは、エクスプローラーから起動し直せば見える
  （インストールより前に開いたシェルから起動すると見えない）（由来: [Phase 28](archive/phase28-more-builtin-tools/KNOWLEDGE.md)）
- winget のポータブルな php（`PHP.PHP.*`）は、アンインストール後も User PATH に winget が足した行が残る（由来: [Phase 28](archive/phase28-more-builtin-tools/KNOWLEDGE.md)）
- winget は rust のバージョンとして rustup 自身のバージョンを出す。rustc のバージョンは `Rustlang.Rust.MSVC` の行（由来: [Phase 28](archive/phase28-more-builtin-tools/KNOWLEDGE.md)）
- PowerShell 5.1 のパイプで日本語を渡すと `???` に化ける。Git Bash から子プロセスに PATH を渡すと、変換で崩れる（由来: [Phase 28](archive/phase28-more-builtin-tools/KNOWLEDGE.md)）

## electron-builder と配布

## GitHub Actions

- リリースの公開で動く workflow は、タグの上で動く。そのため、Environment `github-pages` にはタグ `v*` の許可が要る
  （Pages を有効にしたときに自動で入るのは `main` だけ）（由来: [Phase 29](archive/phase29-github-pages/PLAN.md)）

## ビルドツール

- Rollup は、静的にも読み込むパッケージを `import()` しても別の塊にしない。あとから読ませたいものは、
  別のファイルに分けてそこを `import()` する（由来: [Phase 29](archive/phase29-github-pages/PLAN.md)）
- DOMPurify は DOM が要るので、ビルド時（Node）の描画では動かない（由来: [Phase 29](archive/phase29-github-pages/PLAN.md)）
