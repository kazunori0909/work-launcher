# 実機で確かめた挙動

**いまも当てはまる、実機・OS・外部ツールの挙動と制約。** 全文は読まず、見出しで検索して節だけ読む。

- 決定の理由は [design.md](design.md) に書く。ここには確かめた事実だけを書く
- 当てはまらなくなったら（ツールの更新など）、追記ではなく書き換えるか消す
- 実測値・手順の詳細は archive に残し、ここからはリンクで指す。各項目の末尾に
  `（由来: [Phase N](archive/phase<N>-<slug>/KNOWLEDGE.md)）` を付ける

## Electron

- コンテナの直下に何万もの要素を並べると、行を足す・消すたびに全体の配置を計算し直して止まる。数百個ずつの入れ物に分けると収まる（由来: [Phase 36](archive/phase36-console-bulk-output/KNOWLEDGE.md)）
- 末尾へ動かしながら行を足し続ける使い方では、`content-visibility: auto` はかえって止まりが長くなる（由来: [Phase 36](archive/phase36-console-bulk-output/KNOWLEDGE.md)）
- scroll イベントは、scrollTop を変えた後に遅れて届く。その間に行が増えたり消えたりすると、「末尾にいるか」の判定を誤る。
  上の行を消すと、ブラウザのスクロールアンカーが位置を保とうとする（`overflow-anchor: none` で止まる）（由来: [Phase 36](archive/phase36-console-bulk-output/KNOWLEDGE.md)）

## macOS

- `/usr/bin/ruby` はスタブではなく本物（2.6 系）。Mac では ruby の「未インストール」は出ない（由来: [Phase 28](archive/phase28-more-builtin-tools/KNOWLEDGE.md)）
- ログインシェルの PATH で Homebrew の bin が `/usr/bin` より後ろにあると、Homebrew で ruby を入れても
  `/usr/bin/ruby` が先に見つかる（ターミナルの `ruby --version` と同じ値）（由来: [Phase 28](archive/phase28-more-builtin-tools/KNOWLEDGE.md)）
- `rustup self uninstall -y` は、自分で作った `~/.zshenv`・`~/.profile` を空のまま残す。
  `~/.cargo/bin` がいまのシェルの PATH に無いと `rustup` が見つからないので、フルパスで呼ぶ（由来: [Phase 28](archive/phase28-more-builtin-tools/KNOWLEDGE.md)）
- Cursor のバンドル ID は会社名の入らない形（`com.todesktop.…`）。Spotlight で探すときは実物の Info.plist で確かめる（由来: [Phase 33](archive/phase33-editor-ai-tools/KNOWLEDGE.md)）
- Homebrew の `gemini-cli` は Homebrew の node に依存し、入れると node が上がる（消しても戻らない）（由来: [Phase 33](archive/phase33-editor-ai-tools/KNOWLEDGE.md)）

## Windows

- アプリは起動したときの PATH を使い続ける。インストール後のツールは、エクスプローラーから起動し直せば見える
  （インストールより前に開いたシェルから起動すると見えない）（由来: [Phase 28](archive/phase28-more-builtin-tools/KNOWLEDGE.md)）
- winget のポータブルな php（`PHP.PHP.*`）は、アンインストール後も User PATH に winget が足した行が残る（由来: [Phase 28](archive/phase28-more-builtin-tools/KNOWLEDGE.md)）
- winget は rust のバージョンとして rustup 自身のバージョンを出す。rustc のバージョンは `Rustlang.Rust.MSVC` の行（由来: [Phase 28](archive/phase28-more-builtin-tools/KNOWLEDGE.md)）
- Claude のデスクトップ版は MSIX ではなく Squirrel のインストーラで、アンインストール情報（HKCU）に載る（由来: [Phase 33](archive/phase33-editor-ai-tools/KNOWLEDGE.md)）
- Antigravity のアンインストール情報の表示名は、末尾にバージョンが付く（`Antigravity 2.34.0`）。ほかのアプリは製品名か、` (User)` 付き（由来: [Phase 33](archive/phase33-editor-ai-tools/KNOWLEDGE.md)）
- Gemini CLI は winget に無い。npm の `@google/gemini-cli` で入れる（由来: [Phase 33](archive/phase33-editor-ai-tools/KNOWLEDGE.md)）
- PowerShell 5.1 のパイプで日本語を渡すと `???` に化ける。Git Bash から子プロセスに PATH を渡すと、変換で崩れる（由来: [Phase 28](archive/phase28-more-builtin-tools/KNOWLEDGE.md)）
- `taskkill /F` で止めたプロセスは、シグナルではなく終了コード 1 で終わる（由来: [Phase 36](archive/phase36-console-bulk-output/KNOWLEDGE.md)）
- cmd.exe の `for /l` と `echo` は遅く、10 万行で約 7.6 秒かかる（出力を捨てても）。表示の速さを測るときは、node などで出力を作るほうがよい（由来: [Phase 36](archive/phase36-console-bulk-output/KNOWLEDGE.md)）

## electron-builder と配布

## GitHub Actions

- リリースの公開で動く workflow は、タグの上で動く。そのため、Environment `github-pages` にはタグ `v*` の許可が要る
  （Pages を有効にしたときに自動で入るのは `main` だけ）（由来: [Phase 29](archive/phase29-github-pages/PLAN.md)）

## ビルドツール

- Rollup は、静的にも読み込むパッケージを `import()` しても別の塊にしない。あとから読ませたいものは、
  別のファイルに分けてそこを `import()` する（由来: [Phase 29](archive/phase29-github-pages/PLAN.md)）
- DOMPurify は DOM が要るので、ビルド時（Node）の描画では動かない（由来: [Phase 29](archive/phase29-github-pages/PLAN.md)）
