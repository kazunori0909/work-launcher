# Phase 8: 各プラットフォームへのリリース

## 課題

- ビルドは各自の Mac で `npm run build:win` などを打っている。Windows 版を Mac で作ると
  ネイティブ部分や署名の都合で実機と差が出うるうえ、誰がどのコミットから作ったか追えない
- 作った exe・dmg を渡す場所が決まっていない（GitHub でどう配るかが未整理）
- アプリだけを落とした人には、最初の `work.launcher`・`launcher/` の手本がない
- Mac のインストール版では案件を開けない。Dock へのドロップは起動引数ではなく `open-file` で届くが、
  それを受けていない。開くダイアログも無く、ターミナルか環境変数でしか開けない

## 方針

- GitHub Actions で、Windows は `windows-latest`、macOS は `macos-latest` の runner でそれぞれビルドする
  （各 OS のものはその OS で作る）
- 成果物は次のとおり（→ 決定事項ログ）

  | OS      | インストール版        | ポータブル版     |
  | ------- | --------------------- | ---------------- |
  | Windows | `*-setup.exe`（NSIS） | `*-portable.exe` |
  | macOS   | `*.dmg`               | 作らない         |

- 配布は GitHub Releases に置く（下の「配布のしかた」の案 B）。サンプル案件の zip も添付する
- 案件の開き方を揃える（→ 下の「案件の開き方」）

### 案件の開き方

| 開き方                           | Windows                  | macOS                           |
| -------------------------------- | ------------------------ | ------------------------------- |
| `work.launcher` のダブルクリック | setup.exe が関連付け     | dmg の app が関連付け           |
| アイコンへのドロップ             | 起動引数（今もできる）   | `open-file`                     |
| 「案件を開く…」（⌘O / Ctrl+O）   | ○                        | ○                               |
| 最近開いた案件                   | 開始画面・ジャンプリスト | 開始画面・Dock のメニュー       |
| 新規ウィンドウ（開始画面）       | メニュー（Ctrl+N）       | メニュー（⌘N）・Dock のメニュー |

- 関連付けはインストール版だけ。ポータブル版は関連付けない（置き場所ごとに別の exe のため）
- 案件ごとにウィンドウを開く。同じ案件がもう開いていれば、そのウィンドウを前に出す
- 「新規ウィンドウ」は開始画面を開く。開始画面がもうあれば、それを前に出す（空のウィンドウを並べても使い道がない）
- 案件が決まらないときは、エラーではなく開始画面（「案件を開く…」と最近開いた案件）を出す。
  開始画面から開いたときは、そのウィンドウで開く
- Windows のインストール版は単一インスタンスにする。ポータブル版は開くたびに別プロセスのまま
  （→ 決定事項ログ 2026-11-15）

### 配布のしかた（一般的な方法）

GitHub でビルド済みのファイルを配る方法は主に3つ。

- **A. Actions の Artifacts**: ワークフローの実行結果ページにファイルを添付する。
  GitHub にログインしたリポジトリ閲覧者しか取れず、既定で 90 日で消える。zip に包まれる。
  → 配布ではなく「push ごとの動作確認用」に向く
- **B. GitHub Releases**（一般的）: `v1.2.0` のようなタグに紐づくリリースページを作り、
  exe・dmg を「Assets」として添付する。期限なしで、リポジトリを見られる人ならログインなしの URL で取れる
  （private リポジトリなら権限のある人だけ）。リリースノートも書ける
  - 流れ: `package.json` の version を上げる → `git tag v1.2.0` → push →
    Actions が両 OS でビルド → 下書き（draft）のリリースに添付 → 中身を確かめて「Publish」
  - 添付の手段は、electron-builder 自身の `--publish`（`publish: provider: github`）か、
    `softprops/action-gh-release` などのアクション。前者は後で自動更新（electron-updater）に繋げやすい
- **C. 外部のストレージ・社内共有**（S3・社内ファイルサーバーなど）: 自動更新の配信元にもできるが、
  置き場所の用意と認証情報の管理が要る。今は要らない

zip について: Release には exe・dmg をそのまま添付するのが普通で、zip に包む必要はない
（GitHub が自動で付ける「Source code (zip)」はソースコードで、アプリではない）。
macOS の zip は自動更新で使う形式なので、自動更新をしないうちは作らない。

### 署名について（しない → 決定事項ログ）

- 署名なしでも配れるが、初回起動で警告が出る
  - Windows: SmartScreen の「Windows によって PC が保護されました」→「詳細情報」→「実行」
  - macOS: 「開発元を検証できない」で止まる。システム設定の「プライバシーとセキュリティ」から「このまま開く」
- 警告を消すための署名のしかた（どちらも electron-builder が対応していて、鍵などは GitHub の Secrets に入れる）
  - macOS: Apple Developer Program（個人可・年額）に入り、「Developer ID Application」証明書を作る。
    署名したうえで Apple の公証（notarization）を通す。electron-builder の `mac.notarize` と
    Apple ID・アプリ用パスワード・Team ID（または App Store Connect の API キー）で自動化できる
  - Windows: 2023年6月から証明書の秘密鍵はハードウェア（HSM・USB トークン）に置く決まりになり、
    `.pfx` を Secrets に入れる方法は使えない。CI から使うなら次のどれか
    - Microsoft のクラウド署名サービス（Azure の Trusted Signing。月額。個人で使える地域が限られる）
    - 認証局のクラウド署名（SSL.com eSigner・DigiCert KeyLocker など。年額で高め）
    - オープンソース向けの無償署名（SignPath Foundation。public リポジトリであることなどが条件）
  - Windows は署名しても、ダウンロード数が少ないうちは SmartScreen の警告が出ることがある（評判で消える）

## 決定事項ログ

### 2026-11-14: Windows と macOS の両方を配り、ポータブル版は Windows だけ作る（ユーザー判断）

- 両 OS ともインストール版を用意する（Windows は NSIS、macOS は dmg）
- ポータブル版は Windows だけ。Mac のポータブル版は `.app` の扱いが未解決のまま（→ docs/README.md の「次に扱う候補」）

### 2026-11-14: macOS は arm64 と x64 を別ファイルで作る（ユーザー判断）

- Intel Mac の人にも配る。universal（1ファイルで両方）は大きさが約2倍になるため採らない
- どちらも Apple Silicon の runner で作れる見込み（`npmRebuild: false` でネイティブモジュールを持たないため）。
  作れなければ x64 は Intel の runner で作る

### 2026-11-14: ビルドは `v*` タグの push で動かす（ユーザー判断）

- `main` への push ごとの確認ビルドは回さない（private の間の macOS runner の消費を抑える）。
  必要なら手動実行（`workflow_dispatch`）で回せるようにする

### 2026-11-14: 公開は履歴を消した public リポジトリで v0.1.0 から（ユーザー判断）

- いまは private。ある程度できたら履歴を消した public リポジトリにし、v0.1.0 として公開する
- それまでの Release は private のまま、関係者だけが取れればよい
- public になれば Releases はログインなしで取れ、Actions の通常の runner も無料になる。
  Windows の無償署名（SignPath Foundation）も候補に入る

### 2026-11-14: Release への添付はワークフローで行い、`publish` の設定は消す（ユーザー判断）

- electron-builder はビルドだけ（`--publish never`）。各 OS のジョブの成果物を最後のジョブが集め、
  `gh` で下書きの Release を作って exe・dmg だけを添付する
- 案: `publish: provider: github` で electron-builder に上げさせる方法は、Release に自動更新用の
  `latest.yml`・`.blockmap` が並び、利用者がどれを落とすか迷うため採らない。自動更新を入れるときに見直す

### 2026-11-14: 署名はしない（ユーザー判断）

- 初回起動の警告の越え方を README に書く
- macOS は ad-hoc 署名（`identity: '-'`）だけする。Apple Silicon では署名の無いアプリは「壊れている」と出て開けないため

### 2026-11-14: このフェーズを「各プラットフォームへのリリース」とし、案件の開き方も扱う（ユーザー判断）

- Mac のインストール版で案件を開けないままでは配れないため、別フェーズにせずここで扱う
- 入れるもの: Mac の `open-file`・`.launcher` の関連付け（インストール版）・「案件を開く…」・最近開いた案件
- 案件ごとにウィンドウを開く（今のウィンドウを切り替える案は、実行中のコンソールが消え、
  Windows の「開くたびに別ウィンドウ」と揃わないため採らない）
- サンプル案件（`examples/sample`）を zip にして Release に添付する。アプリに「ひな形を作る」を
  持たせる案は機能追加が大きいため採らない

### 2026-11-14: Info のドライブから、Mac のディスクイメージを除く（ユーザー判断）

- 実機確認で、マウントしたままの dmg が Info のドライブに出た。アプリのインストーラなどで PC の情報ではないため除く
- `hdiutil info` でイメージのマウント先を調べて除く。USB メモリ・外付けディスク・ネットワークドライブは今までどおり出す

### 2026-11-14: アプリとファイルのアイコンを作る（ユーザー判断）

- 雛形のアイコンのままだったため作る。文字は入れず、工具箱の絵にする（「案件の道具を集める」）
- 青い角丸の背景に、オレンジの工具箱とドライバー・スパナ。フラットにうすいグラデーションと影
- `work.launcher` には、紙の上に工具箱を載せたファイルのアイコンを付ける（アプリ本体と見分けるため）
- 元は `build/icons/*.svg`。`npm run icons`（`scripts/make-icons.mjs`）が Electron で描いて
  `.icns`・`.ico`・PNG を書き出す。Mac は背景に余白をとり、Windows は余白を小さくして大きめに描く
- 案: ロケット（他のアプリと似やすい）・ボタンのパネル・フォルダ＋再生マークは採らない

### 2026-11-14: アプリに入れるファイルを、除くものの列挙から入れるものの列挙にする

- 配布物の中身を見ると、`.claude/`・`CLAUDE.md`・`docs/`・`examples/`・`mise.toml` まで入っていた
- `files` を `out/**`・`resources/**`・`package.json` だけにする。実行時の依存は electron-builder が足す

### 2026-11-14: 配布ファイルを小さくする（ユーザー判断）

- 画面のライブラリ（react-markdown・lucide-react など7つ）を devDependencies に移す。ビルドで画面の JS に
  取り込み済みなのに、dependencies にあると node_modules としてもう一度アプリに入っていた（app.asar 33 MB → 4 MB）。
  設定で指定する Lucide のアイコンは、取り込み済みの JS に全部入っているので今までどおり出る
- Electron の言語ファイルを日本語・英語だけにする（`electronLanguages`）
- 圧縮を最大にする（`compression: maximum`）。dmg はさらにワークフローで LZMA（ULMO）に変換する
  （electron-builder が選べるのは bzip2 まで）
- Electron 本体（約 250 MB）は減らせない。小さくするなら Tauri などへの乗り換えになり、作り直しになるため採らない

### 2026-11-14: リリースノートの冒頭にダウンロードの案内を入れる（ユーザー判断）

- Release には GitHub が「Source code」を必ず付け、外せない。どれを落とすか迷わないよう、
  ファイルと対象の表・Mac の見分け方・初回起動の警告の案内を冒頭に置く
- 元は `.github/release-notes.md`。ワークフローがバージョンを埋め、後ろに GitHub の変更点の一覧を足す

### 2026-11-15: Windows のインストール版だけ単一インスタンスにする（ユーザー判断）

- 実機（Ver. 0.0.3）で、ダブルクリック・ジャンプリストから同じ案件を開くと新しいウィンドウが開いた。
  「同じ案件なら前に出す」は同じプロセスのウィンドウしか見ないため
- インストール版はロックを取り、2つめのプロセスは起動引数と作業フォルダを `second-instance` で渡して終わる
- ポータブル版（`PORTABLE_EXECUTABLE_DIR` がある）はロックを取らない。ロックは userData ごとに効くため、
  取ると案件ごとにバージョンの違う exe が1つのプロセスにまとまってしまう。インストール版は1つしか入らないので混ざらない
- 開発中もロックを取らない（インストール版と userData が同じで、取り合いになるため）

### 2026-11-15: Windows のジャンプリストは自前で作り、フォルダ名で出す（ユーザー判断）

- OS の「最近」（`addRecentDocument`）はファイル名しか出せず、どの案件も `work.launcher` で見分けられない
- インストール版は `app.setJumpList` で「最近開いた案件」を作る。表示は開始画面と同じフォルダ名で、
  マウスを乗せるとフルパスが出る。中身は開始画面と同じ `recent.json`
- 案件の `title` は採らない。読むには各案件の設定を読み込む必要があり、開始画面の表示ともずれるため
- ポータブル版はジャンプリストも OS の「最近」も使わない（exe が一時フォルダに展開されて動き、置き場所ごとに別の exe のため）

### 2026-11-15: ライセンスは MIT にし、使っているライブラリのライセンス文をアプリに入れる（ユーザー判断）

- public にして配る（v0.1.0）前に、ライセンスを決めておく。Electron アプリで一般的で短い MIT にする。
  著作権者は GitHub のアカウント名（kazunori0909）
- 案: Apache-2.0（特許の条項が付くが長い）・GPL-3.0（改変して配る人にも公開を求める）・非公開は採らない
- MIT などは「著作権表示と許諾文を含めて配る」ことを求める。画面の JS に取り込んだライブラリ（react など）は
  配布物に LICENSE が残らないため、ビルド（Vite のプラグイン `scripts/licenses.mjs`）で取り込んだパッケージと
  `dependencies` を辿ったものからライセンス文を集め、`out/renderer/third-party-licenses.json` としてアプリに入れる。
  手で一覧を持つ案は、依存を変えるたびにずれるため採らない
- 一覧はヘルプの「このアプリについて > ライセンス」で読める。WorkLauncher 自体の `LICENSE` も同じ章に出し、
  `extraResources` で `LICENSE.txt` としてアプリのフォルダにも置く
- Electron・Chromium のライセンス文（`LICENSE.electron.txt`・`LICENSES.chromium.html`）は electron-builder が自動で残す
  （Mac は `.app` の `Contents/Resources`、Windows はインストール先）ので、こちらでは扱わない
- インストーラーでライセンスへの同意を求める画面（NSIS の `license`）は出さない（MIT で同意は要らないため）
