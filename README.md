# WorkLauncher

[日本語](#日本語) | [English](#english)

![サンプル案件の画面 / The sample project](docs/images/sample.png)

## 日本語

Windows と macOS で使える、日々の作業のためのデスクトップランチャーです。
リポジトリに `launcher/config.yaml` を置いて、ページとボタンを作ります。ボタンでは、コマンドの実行
（bat / sh / PowerShell / Python）、ファイル・フォルダを開く、URL を開く、JavaScript の関数を呼ぶ、ができます。
自分だけの設定は `launcher/config.local.yaml` に書きます。
隣に空の `work.launcher` ファイルを置くと、ダブルクリックで案件を開けます。

- 設定の書き方: [docs/config.md](docs/config.md)
- アプリ内のヘルプ: アプリの最後のタブ

### インストール

[Releases](../../releases) のページからダウンロードします。

| ファイル                                          | 対象                                      |
| ------------------------------------------------- | ----------------------------------------- |
| `work-launcher-<ver>-win-x64-setup.exe`           | Windows（インストール版）                 |
| `work-launcher-<ver>-win-x64-portable.exe`        | Windows（ポータブル版。インストール不要） |
| `work-launcher-<ver>-mac-apple-silicon-arm64.dmg` | Mac（Apple Silicon: M1 以降）             |
| `work-launcher-<ver>-mac-intel-x64.dmg`           | Mac（Intel）                              |
| `work-launcher-sample-<ver>.zip`                  | 始めるためのサンプル案件                  |

Mac の種類は「Apple メニュー > この Mac について」で分かります。「チップ: Apple M…」なら Apple Silicon、
「プロセッサ: … Intel …」なら Intel です。

インストール版では、案件の `work.launcher` をダブルクリックする、アプリのアイコンにドロップする、
「ファイル > 案件を開く…」（Cmd+O / Ctrl+O）のどれかで案件を開けます。

サンプルを試すときは、`work-launcher-sample-<ver>.zip` を展開して `sample/work.launcher` をダブルクリックします
（ポータブル版は、exe を `work.launcher` の隣に置いて exe を起動します）。`sample/launcher/config.yaml` を書き換えて保存すると、
画面にすぐ反映されます。書き方はアプリの「ヘルプ」タブを見てください。

アプリには署名がないため、初回の起動で OS が警告を出します。

- **Windows**: 「Windows によって PC が保護されました」→「詳細情報」→「実行」
- **macOS**: 「“WorkLauncher”は開いていません」→「システム設定 > プライバシーとセキュリティ」を開いて下にスクロールし、
  WorkLauncher の「このまま開く」を押す（最初の 1 回だけ）

### セキュリティ

WorkLauncher は、個人とチームで使うことを想定しています。`config.local.yaml` は自分で書き、共有の `launcher/` の設定は
信頼できる人が書いたもの（たとえばチームのリポジトリでレビューしたもの）である、という前提です。

**案件を開くことは、その案件を信頼することです。** 設定は PC で何でも動かせます。

- `exec` のボタン（bat / sh / PowerShell / Python）は、押すとすぐに動く
- `info.tools` の `command` は、Info タブを開いたときにシェルで動く
- `open` の項目は、どのファイル（プログラムを含む）も開ける
- `url` の項目とリンクは、`openSchemes` に並べたスキームの URL だけを開く（既定は `http`・`https`・`mailto`）。
  `file` を足すと、手元や共有フォルダのファイルも開けるようになる
- `scripts`（JavaScript）は、案件フォルダごとに 1 回だけ、動かす前に確認する。一度許可すると、ファイルが変わっても聞き直さない

知らない人から受け取った案件は開かないでください。`launcher/` の変更はコードと同じようにレビューしてください。
ほかの人も編集できる共有フォルダでは特に注意してください。

WorkLauncher は、自分からはインターネットに何も送りません（テレメトリも自動更新もありません）。
ネットワークにつながるのは、次のときだけです。

- md / html の埋め込みが `https://` の画像を表示するとき（ページを表示したときに読む）
- リンクや `url` の項目を押したとき（ブラウザで開く）
- 自分で書いたコマンドやスクリプトがネットワークを使うとき

### 開発

Node.js 24 が要ります（`mise.toml` で [mise](https://mise.jdx.dev/) に固定しています）。

```bash
npm install
npm run dev     # examples/sample を開く
npm test
npm run build
```

### リリース

`main` は保護しています。変更は PR で入れ、CI（Windows と macOS での lint・typecheck・test）が通ってからマージします。
`v*` のタグを push できるのは管理者だけです。

1. ブランチで `package.json` の `version` を上げ（例: `0.1.0`）、PR を作ってマージする
2. `git tag -a v0.1.0 -m v0.1.0 && git push origin v0.1.0`（注釈付きタグにすると、タグのページに
   最後のコミットのメッセージではなくバージョンが出る）
3. GitHub Actions が Windows と macOS でビルドし、ファイルを添えた**下書き**の Release を作る
   （タグと `package.json` のバージョンが合っている必要がある）
4. Releases のページで下書きを確かめ、ノートを直して **Publish release** を押す。
   公開した Release は変えられない（Immutable releases）

リリースせずにビルドだけしたいときは、Actions タブから **Release** ワークフローを手動で動かします。
ファイルは、その実行の Artifacts に置かれます。

#### ダウンロードしたファイルを確かめる

ファイルには署名がありません。どの Release にも `SHA256SUMS.txt` と build provenance の attestation が付いていて、
このリポジトリのワークフローでビルドしたファイルであることを確かめられます。

```bash
gh attestation verify work-launcher-0.1.0-win-x64-setup.exe -R kazunori0909/work-launcher
```

セキュリティの問題の報告は [SECURITY.md](SECURITY.md) を見てください。

### ライセンス

[MIT](LICENSE)。アプリに入れているライブラリのライセンスは、アプリの「ヘルプ > ライセンス」に一覧があります。
ビルドのときに `scripts/licenses.mjs` が集めています。

## English

A desktop launcher for your daily work, for Windows and macOS.
Put `launcher/config.yaml` in a repository to define pages and buttons that run
commands (bat / sh / PowerShell / Python), open files and folders, open URLs, or call
JavaScript functions. Personal overrides go in `launcher/config.local.yaml`.
An empty `work.launcher` file next to it opens the project with a double-click.

- Configuration spec: [docs/config.md](docs/config.md) (Japanese)
- Built-in help: the last tab in the app

### Install

Download from the [Releases](../../releases) page.

| File                                              | For                                       |
| ------------------------------------------------- | ----------------------------------------- |
| `work-launcher-<ver>-win-x64-setup.exe`           | Windows installer                         |
| `work-launcher-<ver>-win-x64-portable.exe`        | Windows, no install (commit it to a repo) |
| `work-launcher-<ver>-mac-apple-silicon-arm64.dmg` | Mac with Apple Silicon (M1 or later)      |
| `work-launcher-<ver>-mac-intel-x64.dmg`           | Mac with Intel                            |
| `work-launcher-sample-<ver>.zip`                  | Sample project to start from              |

Not sure which Mac you have? Open **Apple menu > About This Mac**: if it shows **Chip: Apple M…**,
use Apple Silicon; if it shows **Processor: … Intel …**, use Intel.

The installed app opens a project by double-clicking its `work.launcher`, dropping it on the
app icon, or File > Open Project (Cmd+O / Ctrl+O).

To try the sample, unzip `work-launcher-sample-<ver>.zip` and double-click `sample/work.launcher`
(or put the portable exe next to it and run the exe). Edit `sample/launcher/config.yaml` and save;
the window updates right away. See the Help tab in the app for how to write it.

The apps are not code-signed, so the OS warns on first launch:

- **Windows**: "Windows protected your PC" → **More info** → **Run anyway**
- **macOS**: "Apple could not verify…" → open **System Settings > Privacy & Security**, scroll down,
  and click **Open Anyway** for WorkLauncher (needed once)

### Security

WorkLauncher is meant for personal and team use. It assumes that you write your own
`config.local.yaml`, and that the shared `launcher/` settings come from people you trust
(for example, reviewed in your team's repository).

**Opening a project means trusting it.** The settings can run anything on your PC:

- `exec` buttons (bat / sh / PowerShell / Python) run as soon as you click them
- `command` in `info.tools` runs in a shell when you open the Info tab
- `open` items can open any file (including programs)
- `url` items and links open only the URL schemes listed in `openSchemes`
  (default: `http`, `https`, `mailto`). Adding `file` lets them open local and shared files too
- `scripts` (JavaScript) asks once per project folder before running; after you allow it,
  it is not asked again even if the files change

Do not open projects from unknown sources. Review changes to `launcher/` as you would review
code, especially in shared folders that others can edit.

WorkLauncher sends nothing to the internet by itself (no telemetry, no automatic updates).
Network access happens only when:

- a markdown / html embed shows an image from an `https://` URL (loaded when the page is shown)
- you click a link or a `url` item (it opens in your browser)
- your own commands and scripts access the network

### Development

Requires Node.js 24 (pinned with [mise](https://mise.jdx.dev/) in `mise.toml`).

```bash
npm install
npm run dev     # opens examples/sample
npm test
npm run build
```

### Release

`main` is protected: changes go through a pull request, and CI (lint, typecheck and test on
Windows and macOS) must pass before merging. Only the admin can push `v*` tags.

1. On a branch, bump `version` in `package.json` (e.g. `0.1.0`), open a pull request and merge it
2. `git tag -a v0.1.0 -m v0.1.0 && git push origin v0.1.0` (an annotated tag, so the tag page
   shows the version instead of the last commit message)
3. GitHub Actions builds on Windows and macOS and creates a **draft** release with the files
   (the tag must match `package.json`)
4. Check the draft on the Releases page, edit the notes, and click **Publish release**.
   Published releases cannot be changed (immutable releases)

To build without releasing, run the **Release** workflow manually from the Actions tab;
the files are attached to the run as artifacts.

#### Verifying a download

The files are not code-signed. Each release has `SHA256SUMS.txt` and a build provenance
attestation, which shows that the file was built by this repository's workflow:

```bash
gh attestation verify work-launcher-0.1.0-win-x64-setup.exe -R kazunori0909/work-launcher
```

To report a security problem, see [SECURITY.md](SECURITY.md).

### License

[MIT](LICENSE). The licenses of the bundled libraries are listed in the app
(Help > ライセンス) and collected at build time by `scripts/licenses.mjs`.
