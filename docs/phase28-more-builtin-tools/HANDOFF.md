# Phase 28 HANDOFF（Mac ⇄ Windows）

依頼と回答のやりとり（書き方は /handoff）。新しい依頼は末尾に足す。

## 2026-11-22 02:25 mac → win: ruby・go・rust・php の取得を入れて消して確かめる

- 状態: 回答済み
- 関連: PLAN.md「方針」、KNOWLEDGE.md「Mac」（Mac の結果）

### 依頼

- 背景: Info の組み込みのツールに ruby・go・rust・php を足した（`src/core/builtinTools.ts`）。
  アプリを起動せずに Info と同じ判定を動かす `scripts/check-tools.mjs` と、
  入れる・確かめる・消すの手順のスキル `/check-tools` を作った。Mac では4つとも回した
- やってほしいこと:
  1. ブランチ `phase28-more-builtin-tools` を pull して `npm ci`
  2. `/check-tools` を ruby・go・rust・php で回す（入れ方の表は SKILL.md。winget の ID が違えば SKILL.md の表を直してよい）。
     元から入っているものは入れる・消すを飛ばす
  3. それぞれのインストール後（消す前）に、`/run-app` で `examples/sample` の Info タブの「ツール」の枠の文字も取る。
     run-app はいまのシェルの PATH を引き継ぐので、`check-tools.mjs`（レジストリの PATH）と違う値になったら、その違いも書く
  4. UAC の確認が出たツールがあれば、どれかを書く
- 返してほしいもの:
  - ツールごとの4段の表（未インストール時・インストール・インストール後・アンインストール後）と、
    Info 画面の値
  - 期待と違った結果の原因（コマンドの出力・`where` で見つかった場所）
  - 直した方がよいと思うこと（コードは直さず、書くだけ）

### 回答

2026-11-22、Windows 11 Home 25H2（26200）、winget。4つとも元は未インストールだったので、すべて入れて消した。
winget の ID は SKILL.md の表のままで通った（より新しい `RubyInstallerTeam.Ruby.4.0`・`PHP.PHP.8.6` もある）。

| ツール | 未インストール時 | インストール                 | インストール後 | アンインストール後 |
| ------ | ---------------- | ---------------------------- | -------------- | ------------------ |
| go     | 未インストール   | `GoLang.Go`                  | 1.27.4         | 未インストール     |
| ruby   | 未インストール   | `RubyInstallerTeam.Ruby.3.4` | 3.4.13         | 未インストール     |
| php    | 未インストール   | `PHP.PHP.8.4`                | 8.4.28         | 未インストール     |
| rust   | 未インストール   | `Rustlang.Rustup`            | 1.100.0        | 未インストール     |

- バージョンは winget と合った（ruby は winget が `3.4.13-1-x64`。rust は winget が rustup 自身の `1.29.3` を出すので、
  `Rustlang.Rust.MSVC` の `1.100.0` と比べた）
- 見つかった場所: go `C:\Program Files\Go\bin\go.exe`、ruby `C:\Ruby34-x64\bin\ruby.exe`、
  php `%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.4_…\php.exe`、rust `%USERPROFILE%\.cargo\bin\rustc.exe`

**Info 画面の値（run-app）**

- レジストリの PATH（Machine + User）を渡して起動すると、4つともインストール後に `check-tools.mjs` と同じ値を出した
- **いまのシェルの PATH のまま起動すると、インストール後でも「未インストール」**（go で確かめた）。
  シェルを開いたのがインストールより前なので、PATH に `C:\Program Files\Go\bin` が無い。
  エクスプローラーから新しく起動したアプリは更新後の PATH を受け取るので、利用者の操作としては問題ない
- run-app に PATH を渡すときは、Git Bash からだと PATH の変換で崩れた（git や python まで未インストールになる）。
  PowerShell で `$env:Path` をレジストリの値にしてから `driver.mjs` を呼ぶと正しく取れた
- PowerShell 5.1 のパイプで driver に日本語のセレクタを渡すと `???` に化ける（eval の中は `escape()` で比べて避けた）

**UAC**

- どのツールでも出なかった。ただしこのシェルは管理者として昇格済みだった（`WindowsPrincipal.IsInRole` で管理者のロールが True）ので、
  通常のユーザーのシェルでは出ない、とは言えない

**期待と違ったこと**

- **php はアンインストール後も User PATH に `%LOCALAPPDATA%\Microsoft\WinGet\Packages\PHP.PHP.8.4_…` が残る**
  （フォルダ自体は消えている）。判定は「未インストール」に戻るので結果には影響しない。手では消していない
- ruby・rust は残りなし（`C:\Ruby34-x64`・`~\.cargo`・`~\.rustup` も PATH の行も消えた）

**直した方がよいと思うこと（コードは直していない）**

- run-app の SKILL.md に「インストール直後はいまのシェルの PATH が古い。新しく起動したアプリと同じにするには
  PowerShell で `$env:Path` をレジストリの値にしてから呼ぶ」と書いておくとよい
- check-tools の SKILL.md の Windows のアンインストールに、「php は winget が User PATH に足した行が残る」と注を足す
- `npm ci` で `install-scripts` の警告（electron-winstaller など）が出た。run-app・ビルドは動いた
