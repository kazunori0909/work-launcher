# 設定ファイル仕様

案件リポジトリに置く設定ファイルの書き方。**実装の正はこのファイル**（理由・経緯は
[phase1 の PLAN.md](archive/phase1-overall-design/PLAN.md)）。JSON Schema はこの内容から作る。

## 1. ファイル構成

```
<ランチャーのフォルダ>/          ← 案件リポジトリの直下か、その下のフォルダ
  WorkLauncher.exe        ← ポータブル版（Windows。リポジトリに同梱するとき）
  work.launcher           ← 目印（中身は読まない）
  launcher/
    config.yaml              ← 共通の設定（コミットする）
    config.local.yaml        ← 個人用（.gitignore に入れる）。書き方は config.yaml と同じ
    scripts/*.js             ← function から呼ぶ関数（既定で中の .js をすべて読む）
    console.yaml             ← コンソールの色分け
    style.css                ← 案件ごとの見た目（任意。`style` で指定）
    pages/*.yaml             ← ページの分割（config.yaml から include する）
```

- `${launcherDir}` は `work.launcher` があるフォルダ。`${workDir}` は作業フォルダ（`cwd`。→ 4章）
- 設定に書く**相対パスは `${launcherDir}` 起点**（どのファイルに書いたかによらない）。
  ただし案件のファイルを開く `open`・`excel`・`powerpoint`・`word` だけは `${workDir}` 起点（→ 3.2）
- `work.launcher` は空でよい。ランチャーのフォルダの目印と、起動時に指定するファイルとして使う
  （拡張子の関連付けによるダブルクリック起動は後のフェーズ）。
  設定を別の `.yaml` にしているのは、エディタが設定なしで YAML と認識するため（→ phase5 の PLAN.md）

### 使い方（2通り）

1. **リポジトリに同梱する**（Windows のみ）: ポータブル版の `WorkLauncher.exe` を `work.launcher` と同じフォルダに置いてコミットする。
   exe をダブルクリックすると、そのフォルダの案件を開く。インストールは要らない。案件ごとにツールのバージョンが固定される。
   Mac にポータブル版は無い（`.app` はファイルの多いフォルダで同梱に向かないため。→ phase6 の PLAN.md）
2. **インストールする**: Mac・Windows の各 PC にアプリを1つ入れ、案件の `work.launcher` を開く。
   開き方は `work.launcher` のダブルクリック（インストール版が `.launcher` を関連付ける）・
   アプリのアイコンへのドロップ・メニューの「案件を開く…」（⌘O / Ctrl+O）・最近開いた案件。
   案件ごとにウィンドウが開き、同じ案件がもう開いていればそのウィンドウを前に出す

開く案件は次の順に決める。

1. 起動引数の `.launcher` ファイル、またはそれを含むフォルダ
2. 環境変数 `LAUNCHER_PROJECT`
3. アプリ（ポータブル版は元の exe）と同じフォルダに `work.launcher` があれば、そのフォルダ
4. どれも無ければ開始画面（「案件を開く…」と最近開いた案件）を出す（開発中は `examples/sample` を開く）

Mac では、Dock へのドロップとダブルクリックは起動引数ではなく `open-file` で届く。
起動前に届いたものは 1 より先に使う

## 2. config.yaml の全体

```yaml
# yaml-language-server: $schema=https://.../launcher.schema.json
version: 1
title: Sample Project # ヘッダーとウィンドウタイトル
style: launcher/style.css # 案件ごとの見た目（→ 8章）
scripts: # function で読む JS（→ 3.2。省略時は launcher/scripts/）
  - launcher/scripts/
  - tools/deploy.js
cwd: ../scripts # 実行系の作業フォルダの既定（→ 3.3）
openSchemes: [http, https, mailto, file] # 外部に開いてよいスキーム（→ 3.5）
pages:
  - id: top # 予約 ID。最初に開くページ
    title: メイン
    items:
      - bat: build.bat
        sh: ./build.sh
        label: ビルド
        icon: play
  - include: launcher/pages/tools.yaml # 1ファイル = 1ページ
info: # → 7章
  env: [JAVA_HOME]
  tools: [git, node]
```

| キー          | 必須 | 内容                                  |
| ------------- | ---- | ------------------------------------- |
| `version`     | ○    | 仕様のバージョン。いまは `1`          |
| `title`       |      | 案件名。省略時はフォルダ名            |
| `style`       |      | 当てる CSS ファイル（→ 8章）          |
| `scripts`     |      | function で読む JS・フォルダ（→ 3.2） |
| `cwd`         |      | 実行系の作業フォルダの既定（→ 3.3）   |
| `openSchemes` |      | 外部に開いてよいスキーム（→ 3.5）     |
| `pages`       | ○    | ページの並び（表示順）                |
| `info`        |      | Info ページの設定                     |

### ページ

| キー      | 内容                                                         |
| --------- | ------------------------------------------------------------ |
| `id`      | ページ ID（英数字と `-` `_`）。ローカル合成のキー            |
| `title`   | タブに出す名前。省略時は `id`                                |
| `icon`    | タブのアイコン（Lucide の名前）                              |
| `cwd`     | このページの実行系の作業フォルダ（→ 3.3）                    |
| `items`   | 項目の並び                                                   |
| `include` | 別ファイルのページを読み込む（このときほかのキーは書かない） |

- 予約 ID: `top`（メイン）・`help`（ヘルプ）・`info`（Info）。
  `help`・`info` は組み込みページで、`pages` に書かなくても表示される。`title` を書けばタブ名が変わる
- `help` はアプリの使い方（設定の書き方・ボタンの見本・アイコン一覧）で、常に最後のタブに出る。
  左に章の一覧（分類ごとの二階層）、右に選んだ章の本文を出す。`pages` に `help` を書くと、その `items` を最初の章に出す（章の名前は最上位の `title`。省略時はフォルダ名）
- `info` は PC の情報（→ 7章）で、`help` の前のタブに出る。`pages` に `info` を書くと、その `items` を情報の後ろに足す
- include 先のファイルはページ1つ分（`id`・`title`・`items`）を書く

## 3. 項目（items）

項目の種類は**種類キー**で決まる。1項目に種類キーは1つ。
例外は実行系で、`bat` と `sh` だけは併記できる（→ 3.3）。

| 種類キー                                 | 動作                             |
| ---------------------------------------- | -------------------------------- |
| `function`                               | JS（`scripts`）の関数を呼ぶ      |
| `excel` / `powerpoint` / `word` / `open` | ファイル・フォルダを開く         |
| `bat` / `sh` / `powershell` / `python`   | コマンドを実行しコンソールに出す |
| `html` / `md`                            | ページ内に埋め込む               |
| `url`                                    | 既定のブラウザで開く             |
| `break` / `heading`                      | 並びの改行 / 見出し              |
| `group` / `buttons`                      | 枠で囲む / ボタンを1つの塊にする |
| `details`                                | 押すと開閉する枠に入れる         |
| `select` / `radio` / `checkbox`          | 選択肢。値をほかの項目で使う     |
| `reset`                                  | select などを初期値に戻す        |

### 3.1 共通属性

| 属性                           | 内容                                                                                                                        |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `label`                        | ボタンの文字。省略時は種類キーの値から作る（ファイル名など。実行系はその OS で実行する方の1行目）。`""` で出さない          |
| `icon`                         | アイコン名（[Lucide](https://lucide.dev/icons/) の名前。例 `folder-open`）。省略時は種類ごとの既定（下表）、`""` で出さない |
| `tooltip`                      | ホバー時の説明                                                                                                              |
| `confirm`                      | 実行前に出す確認文。書いたときだけ確認する                                                                                  |
| `id`                           | 項目 ID（任意）。ローカル設定から置き換えるときに使う（→ 5章）                                                              |
| `enabledWhen` / `disabledWhen` | select などの値で押せる・押せないを変える（→ 3.10）                                                                         |

埋め込み系（3.4）は `label`・`icon`・`tooltip`・`confirm` を使わない。

| 種類                                | 既定の `icon`                                   |
| ----------------------------------- | ----------------------------------------------- |
| `bat`・`sh`・`powershell`・`python` | `terminal`                                      |
| `url`                               | `globe`                                         |
| `open`                              | `file`（最後に拡張子があるとき）・`folder-open` |
| `function`                          | `code`                                          |
| `excel`・`powerpoint`・`word`       | `file-spreadsheet`・`presentation`・`file-text` |
| `reset`                             | `list-restart`                                  |

### 3.2 function / ファイルを開く

```yaml
- function: openLogFolder # `scripts` に並べた JS の関数名
  label: ログを開く
  confirm: よろしいですか？
- excel: docs/仕様書.xlsx
  readonly: true
- powerpoint: docs/説明.pptx
- word: docs/手順書.docx
- open: out # OS の既定アプリで開く（フォルダならエクスプローラー/Finder）
```

- `open`・`excel`・`powerpoint`・`word` の相対パスは `${workDir}` 起点（案件で管理するファイルを指すため）。
  ランチャーの中のファイルは `${launcherDir}/launcher/…` のように書く。関数の `ctx.open`・`ctx.excel` なども同じ

- `excel`・`powerpoint`・`word`: Windows は Excel・PowerPoint・Word で開く。Mac は Office で開き、
  入っていなければ既定のアプリ（Numbers・Keynote・Pages など）で開く
- `readonly`（`excel`・`powerpoint`・`word` のみ）: Windows だけ効く。Excel は `/r`、PowerPoint・Word は
  読み取り専用の起動オプションが無いため COM で読み取り専用で開く（Word の `/r` は登録し直しで別物）。Mac では無視する（→ phase6 の PLAN.md）
- 関数は最上位の `scripts` に並べた JS から名前で探す。フォルダを書くと中の `.js` を名前順にすべて読む
  （サブフォルダは見ない）。省略時は `launcher/scripts/`
  - 同じ関数名が複数のファイルにあれば、押したときにエラーにする
  - 並べたファイル・フォルダが無ければ、押したときにエラーにする
- JS の形（`module.exports` に関数を並べる。async でもよい）:

  ```js
  module.exports = {
    openLogFolder(ctx) {
      ctx.log('ログを開きます')
      ctx.open('logs')
    }
  }
  ```

  | `ctx` の中身      | 内容                                         |
  | ----------------- | -------------------------------------------- |
  | `launcherDir`     | work.launcher があるフォルダ                 |
  | `workDir`         | 作業フォルダ（関数もこのフォルダで動く）     |
  | `env`             | 環境変数                                     |
  | `log(text)`       | コンソールに1行書く（コンソールは開かない）  |
  | `open(path)` など | 項目と同じ動作を呼ぶ（下の表）               |
  | `select`          | select・radio・checkbox の値（→ 3.8）        |
  | `set(id, value)`  | select・radio・checkbox の値を変える（下）   |
  | `reset(ids)`      | select・radio・checkbox を初期値に戻す（下） |
  | `disable(ids)`    | 項目を押せなくする（下）                     |
  | `enable(ids)`     | 項目を押せるようにする（下）                 |
  | `lang`            | 表示の言語（`ja` / `en`。→ 8章）             |
  - 項目と同じ動作は、種類キーと同じ名前の関数で呼ぶ。2つ目の引数に書けるのは動作に関わるキーだけ
    （`label`・`icon` などは書けない。知らないキーは例外にする）

    | 関数                                         | 2つ目の引数                                     |
    | -------------------------------------------- | ----------------------------------------------- |
    | `ctx.open(path)`                             | なし                                            |
    | `ctx.url(url, { params })`                   | `params`                                        |
    | `ctx.excel(path, { readonly })` など         | `readonly`                                      |
    | `ctx.bat(script, { cwd })` など（実行系4種） | `cwd` / `env` / `encoding` / `wait` / `console` |
    - パスの起点・変数（4章）・`openSchemes`・OS ごとの動きは、YAML に書いたときと同じ
    - 複数行はバッククォートで書ける。前後の空行と共通のインデントは取り除く（YAML の `|` と同じ形にする）。
      `bat` の改行は CRLF にする。その中の設定の変数は `\${workDir}` と書く
    - `bat` の結果の `stdout` には、実行したコマンドのエコーも入る（3.3 と同じ）。読むときは `@echo off` を書く
    - 実行系の `cwd` を省くと、関数の作業フォルダ（`ctx.workDir`）で動かす。相対の `cwd` は YAML と同じく
      launcherDir 起点（`ctx.open`・`ctx.excel` などのパスは workDir 起点。→ 3.2）。出力はコンソールに出す
    - どれも Promise を返す。実行系は終わるまで待ち、`{ code, signal, stdout, stderr }` を返す
      （止めたときは `code` が `null`。`stdout`・`stderr` は出力の行を改行でつないだ文字列）。
      `wait: false` を書くと、始めたところで返す（出力は受け取れない）
    - `console: false` を書くと、その実行をコンソールに出さない（開始・出力・終了のどれも）。
      実行中の一覧にも出ないので、画面からは止められない
    - 失敗（ファイルが無い・始められない など）は例外にする。`await` していなければ、コンソールにエラーを出して
      関数は続ける。0 以外の終了コードは例外にしない
    - 関数は、頼んだ動作がすべて終わるまで終わらない（`wait: false` の実行は待たない）。
      関数から始めた実行は、関数が終わっても動き続け、ウィンドウを閉じたときに止める

  - 項目の値と押せる・押せないは `ctx.set`・`ctx.reset`・`ctx.disable`・`ctx.enable` で変える（どれも Promise を返す）。
    初期値に戻すだけなら `reset` の項目（→ 3.9）、値で決まる押せる・押せないなら `enabledWhen`・`disabledWhen`（→ 3.10）を YAML に書けばよい

    ```js
    ctx.set('target', 'prod') // select・radio は選択肢の値
    ctx.set('dry', true) // checkbox は on・off の値か true / false
    ctx.reset('debug') // 初期値に戻す。group の ID なら中の項目。引数なしなら全部
    ctx.disable('reset-db') // 項目の id。['a', 'b'] のように並べてもよい
    ctx.disable() // 引数なしなら全部の項目
    ctx.enable() // 引数なしの disable() を戻す（ID で押せなくした分はそのまま）
    ```

    - `set` の `id` は select・radio・checkbox の ID。選択肢に無い値・無い ID は例外にする。
      `remember: true` なら記憶する。`change` の関数は呼ばない（互いに書き換えて止まらなくなるのを避ける）
    - `reset` の初期値は `default`（無ければ最初の選択肢。checkbox はオフ）。ID は select の ID か、
      `group`・`buttons` の ID（中の select・radio・checkbox を戻す）。`remember`・`change` の扱いは `set` と同じ
    - `set`・`reset` を `await` したあとは、同じ関数の `ctx.select` と、そのあとに頼む動作の `${select:ID}` に入る
    - `disable`・`enable` の ID は、項目の `id`（ボタン・`group`・`buttons`）か select の ID。
      `group`・`buttons` を指定すると中の項目も変わる。同じ ID の項目はページをまたいで全部変わる。
      無い ID・押せる項目でない ID（見出し・md など）は例外にする
    - 引数なしの `disable()`・`enable()` は「全部」だけを切り替え、ID で押せなくした分は保つ
      （処理の間だけ全部を止めて、終わったら元の状態に戻せる）。
      `disable()` の間は、ID を指定した `enable` では戻らない。戻すのは引数なしの `enable()`
    - 押せない状態は設定の読み直しでは保ち、案件を開き直したら戻す。開いたときから押せなくするなら
      `beforeOpen`・`afterOpen` で呼ぶ（→ 10章）
    - 押せなくするのは画面の操作だけ。関数から `ctx.bat` などで呼ぶ動作は止めない
    - `enabledWhen`・`disabledWhen` とは、どちらかが押せなくすれば押せない

  - それ以外は Node の機能（`child_process` など）を直接使える
  - 押すたびに別プロセスで JS を読み直して呼ぶ（編集はすぐ反映される）
  - 初めて function の項目を押したときに、その案件の JS を実行してよいか確認する。
    許可した案件は記録し、次からは聞かない（イベントがあるときは開いた直後に確認する。→ 10章）
  - 例外が出たときはコンソールを開いてエラーを出す

### 3.3 実行（bat / sh / powershell / python）

```yaml
- bat: |
    cd tools
    call setup.bat
    build.bat
  sh: |
    cd tools
    ./setup.sh && ./build.sh
  label: ビルド
  cwd: tools # 作業フォルダ（下記）
  env: # 追加する環境変数
    BUILD_MODE: debug
```

- `cwd`（作業フォルダ）は、項目 → ページ → 最上位の順に、最初に書かれたものを使う。
  どこにも無ければ `${launcherDir}`
  - 相対パスは `${launcherDir}` 起点、絶対パス（`C:\work\scripts`・`/opt/scripts`）も可
  - 案件のスクリプト置き場を最上位の `cwd` にすれば、本文には `build.bat` と書くだけで呼べる
  - 存在しないフォルダなら実行せず、コンソールにエラーを出す

- 値は**スクリプトの本文**。1行ならそのままコマンド、複数行は `|` で書く。
  既存のファイルを動かすときは `build.bat` のようにファイル名を書けばよい
- 本文を一時ファイルに書き出して実行する

  | キー         | 実行方法                                    | 動く OS |
  | ------------ | ------------------------------------------- | ------- |
  | `bat`        | `cmd /c <一時.bat>`                         | Windows |
  | `sh`         | `bash <一時.sh>`（Win は Git Bash）         | 両方    |
  | `powershell` | `pwsh`（Win は無ければ `powershell`）       | 両方    |
  | `python`     | `python3`（Win は `py`、無ければ `python`） | 両方    |

- `powershell` は出力を UTF-8 にしてから一時ファイル（BOM 付き UTF-8）を呼ぶ。Windows PowerShell 5.1 でも
  日本語の本文・出力が化けない。構文エラーなどで止まったら終了コード 1、それ以外は `exit` の値
- Windows の `python.exe` は、Python が無くても Microsoft Store へ案内するスタブのことがある。
  スタブに当たったら（終了コード 9009）、Python が見つからないとコンソールに出す
- `python` には環境変数 `PYTHONIOENCODING=utf-8` を渡す（Windows の Python はパイプへの出力を cp932 で出すため）。
  すでに設定されているとき、項目の `env` で指定したときはそちらを使う

- `bat` と `sh` を併記すると、Windows は bat、Mac は sh を実行する
- `bat` だけの項目は Mac では無効表示。`sh` だけなら Windows でも Git Bash で実行する
- Windows の bash は Git for Windows のもの（Git Bash）を使う。標準のインストール先と、PATH 上の
  `git.exe` の場所から探す（PATH の `bash` は WSL のことがあるため使わない）。見つからなければエラー
  （押せないボタンにして、ツールチップで理由を出す）
- 出力（stdout・stderr）は行ごとにアプリ内コンソールへ出し、`console.yaml` で色分けする。
  実行の始めに、作業フォルダをプロンプトの形（`C:\work>`・`/work $`・`PS C:\work>`）で出し、
  その後ろに実行する本文（変数の置き換え後）を出す。2行目以降は `> ` で続け、10行を超える分は行数だけ出す。
  コンソールは実行系を始めたときと、操作のエラーが出たときにだけ開く（ファイル・URL を開く操作や
  `function` では開かない）。
  終了コードが 0 以外なら失敗として表示する
- 実行中はボタンを実行中表示にし、コンソールから停止できる
- 入力は受け付けない（標準入力は空）。`pause`・`set /p`・`read` などの入力待ちは止まらずに進む
- `bat` は通常の .bat と同じく、実行したコマンドも表示される。不要なら先頭に `@echo off` を書く
- `encoding`（任意）: 出力の文字コード。省略時は Windows の bat が `cp932`、それ以外は `utf-8`

### 3.4 埋め込み（html / md）

```yaml
- md: |
    ## 手順
    1. ビルドする
- md: launcher/help/setup.md # 1行で .md で終わればファイルを読む
- html: <div class="note">注意書き</div>
```

- `md` の値は、1行だけで `.md` で終わればファイルのパス、それ以外は Markdown の本文として扱う
  （`.md` で終わる1行の本文を書きたいときは、句点を付けるなどで避ける）
- その位置にそのまま描画する（ボタンにはならない）
- Markdown は GitHub と同じ書き方（表・チェックリスト・打ち消し線など）。md 内の HTML も使える
- `html` と md 内の HTML は、`<script>`・イベント属性（`onclick` など）・`<form>` を取り除いて描く。
  `class`・`style` 属性は使える。`html` の `<style>` は画面全体に効くため取り除く（見た目は `style` で変える）。
  動きが要るものは `function` で書く
- 本文に `: ` を含むときは `|` の次の行から書く（1行に続けると YAML のキーと読まれる）
- md ファイルは保存すると読み直す。ファイルが無ければその位置にエラーを出す

リンクと画像:

- 相対パスは `${launcherDir}` 起点。md ファイルの中だけは、その md ファイルの位置が起点
  （例外的にファイル起点）。`/` 始まりは `${launcherDir}` 起点
- スキーム付きのリンク（`https://…` など）は、`openSchemes`（→ 3.5）で許可したものだけ開く。既定は `http`・`https`・`mailto`
  （許可していないスキームのリンクは、押しても何も起きない）
- 中クリックもクリックと同じに扱う（新しいウィンドウは開かない）
- ファイル・フォルダへのリンクは OS の既定のアプリで開く（`open` と同じ）
- `#見出し` のリンクはページ内のその見出しへ移る（見出しの id は GitHub と同じ付け方）
- 画像はランチャーのフォルダの中のファイルと `https` の URL を表示する。フォルダの外の画像は表示しない

### 3.5 URL

```yaml
- url: https://www.google.com/search
  params:
    q: あいうえお # 自動で URL エンコードして ?q=... を付ける
  label: 検索
```

- 既定のブラウザで開く
- `url` に既にクエリがあれば `params` は `&` で後ろに足す

開いてよいスキーム（`openSchemes`）:

```yaml
openSchemes: [http, https, mailto, file] # config.yaml の最上位
```

- `url` 項目・md / html のリンク・`ctx.url` のどれも、ここに並べたスキームの URL だけを開く。
  `url` 項目・`ctx.url` はコンソールにエラーを出して開かない。リンクは押しても何も起きない
- `javascript`・`vbscript`・`data` は書けない
- 省略時は `[http, https, mailto]`。書いたらその並びで置き換える（足すときも既定の 3 つを書く）
- `file` を許すと、`file:///C:/share/a.xlsx` や `file://server/share/資料.pdf` を、パスに直して `open` と同じく開く
  （無ければエラー、Mac のフォルダは Finder）。exe なども開けてしまうので、必要な案件でだけ許す
- 大文字・小文字は区別しない。`file:` のように末尾の `:` を付けてもよい

### 3.6 改行と見出し（break / heading）

```yaml
- heading: ビルド # 改行して小さな見出しを出す
- bat: build.bat
- bat: test.bat
- break # 改行だけ（`- break:` と書いてもよい）
- bat: clean.bat
```

- ボタンは横に並び、幅が足りなければ折り返す。それ以外の位置で行を変えたいときに使う
- `id` を付ければ、ローカル設定から置き換えられる（ほかの共通属性は使わない）

### 3.7 グループ・ボタングループ・折りたたみ（group / buttons / details）

```yaml
- group: 資料 # 枠で囲む。値は枠の見出し（`group:` だけなら見出しなし）
  icon: folder # 見出しのアイコン（任意）
  items:
    - buttons: # ボタンを1つの塊にする
        - excel: docs/見積書.xlsx # ふだんは読み取り専用で開く
          readonly: true
        - excel: docs/見積書.xlsx # 編集するときだけ横の小さなボタンで開く
          label: ''
          icon: pencil-line
          tooltip: 編集モードで開く
    - md: 説明.md
```

- `group` は `items` に並べた項目を枠で囲む。枠は中身に合わせた幅で、ほかの項目と同じく横に並ぶ
  - 中には `group` 以外の項目を置ける（グループの中にグループは置けない）
  - 書けるキーは `group`・`items`・`icon`・`id`・`enabledWhen`・`disabledWhen`
- `buttons` は並べたボタンの枠をつなげて、1つの塊に見せる。2つ目以降は操作ボタンとして少し詰めて出す
  - 中に置けるのはボタンになる項目（`function`・ファイルを開く・実行系・`url`・`reset`）だけ。それ以外はその位置にエラーを出す
  - 書けるキーは `buttons`・`id`・`enabledWhen`・`disabledWhen`。中のボタンは普通の項目と同じ書き方
- グループ・ボタングループの中の項目も、`id` を付ければローカル設定から置き換えられる（→ 5章）

折りたたみ（details）:

```yaml
- details: 古い手順について # 見出し。押すと開閉する
  text: | # 書いたままの文（改行もそのまま）
    2025 年までの手順です。
- details: 詳しい設定
  expanded: true # 開いた状態で出す（既定は閉じる）
  frame: true # 枠で囲む（既定は枠なし）
  items: # group と同じく項目を並べる
    - bat: setup.bat
```

- 中身は `text` と `items` のどちらか、または両方で書く。両方あれば `text` を先に出す
- 1行を占める。既定は枠を付けず、開いた中身の左に線を引く。`frame: true` で枠で囲む
- 開閉は覚えない（ページを開き直すと書いたとおりに戻る）
- 中にはどの項目も置ける（details・group も置ける）
- 書けるキーは `details`・`text`・`items`・`expanded`・`frame`・`icon`・`id`。
  開いて出すキーが `open` でないのは、`open` が種類キー（→ 3.2）だから

### 3.8 選択（select）

```yaml
- select: target # select の ID（英数字と - _）。値を参照するときに使う
  label: 接続先 # 選択肢の左に出す文字（任意）
  options:
    - dev # 値だけ（表示も同じ）
    - { label: 本番, value: prod } # 表示と値を分ける
  default: dev # 既定値（任意。省略時は最初の選択肢）
  remember: true # 選んだ値を記憶する（省略時は記憶しない）
  change: onTargetChange # 値を変えたときに呼ぶ関数（任意。→ 10章）
- bat: deploy.bat ${select:target}
  sh: ./deploy.sh ${select:target}
  label: デプロイ
  confirm: ${select:target} にデプロイしますか？
```

- 選んだ値は `${select:ID}` で参照する（→ 4章）。function では `ctx.select.ID`、変えるときは `ctx.set`（→ 3.2）
- `remember: true` なら、選んだ値を案件フォルダごとに記憶し、開き直したときもその値を使う。
  記憶はアプリのユーザーデータに置き、案件リポジトリには書かない
- 記憶しないときは、開くたび（設定を読み直したときは除く）に既定値に戻る
- 記憶した値が選択肢から消えていれば、既定値に戻る
- 同じ ID の select を複数置くと、同じ値を共有する（ページをまたいで同じ選択を出せる）
- 書けるキーは `select`・`label`・`tooltip`・`options`・`default`・`remember`・`change`・`enabledWhen`・`disabledWhen`。
  `id` は `select` の値と同じになる（ローカル設定から同じ ID で置き換えられる）
- `buttons` の中には置けない

#### ラジオボタン（radio）

```yaml
- radio: mode # select と同じキーで書ける。選択肢を横に並べる
  label: モード
  options: [debug, release]
  default: release
- sh: ./build.sh ${select:mode}
```

- 書けるキーは select と同じ（`select` の代わりに `radio`）。値の参照・記憶・共有も select と同じ
- `buttons` の中には置けない

#### チェックボックス（checkbox）

```yaml
- checkbox: dry # オン・オフの1つ
  label: 試しに実行 # チェックの右に出す文字（省略時は ID）
  on: --dry-run # オンのときの値（省略時は true）
  off: '' # オフのときの値（省略時は false）
  default: true # 最初からオンにする（省略時はオフ）
- sh: ./deploy.sh ${select:dry}
```

- 値の参照・記憶・共有は select と同じ（`${select:ID}`・`ctx.select.ID`・`remember`）
- 書けるキーは `checkbox`・`label`・`tooltip`・`on`・`off`・`default`・`remember`・`change`・`enabledWhen`・`disabledWhen`。
  `on` と `off` は違う値にする
- `buttons` の中には置けない

#### select・radio・checkbox の ID

- ID は3つで共通。種類が違っても、同じ ID は同じ値を指す（別の種類で同じ ID は使わない）

### 3.9 初期値に戻す（reset）

```yaml
- group: デバッグ用
  id: debug-tools
  items:
    - select: log-level
      options: [low, middle, high]
      default: middle
    - checkbox: log-file
    - reset: debug-tools # 押すと、グループの中の select・checkbox を初期値に戻す
      label: '' # 省略時は「リセット」
```

- 値は戻す項目の ID か、`[log-level, log-file]` のような ID の並び。select・radio・checkbox の ID か、
  `group`・`buttons` の ID（中の select・radio・checkbox をまとめて戻す）
- 初期値・記憶・`change` の扱いは JS の `ctx.reset` と同じ（→ 3.2）
- 書けるキーはボタンと同じ（`label`・`icon`・`tooltip`・`confirm`・`id`・`enabledWhen`・`disabledWhen`）。
  `buttons` の中にも置ける
- 無い ID・中に select の無い枠の ID は、その項目をエラーにする

### 3.10 押せる・押せないの条件（enabledWhen / disabledWhen）

```yaml
- radio: mode
  options: [debug, release]
- checkbox: log
- group: デバッグ用
  disabledWhen: { mode: release } # release の間は、中の項目ごと押せない
  items:
    - sh: ./debug.sh
      enabledWhen: { log: true } # チェックを入れたときだけ押せる
```

- `enabledWhen` は条件に合うときだけ押せる。`disabledWhen` は条件に合うと押せない。1つの項目にはどちらか一方だけ
- 条件は「select・radio・checkbox の ID: 値」の組。値を並べる（`[dev, stg]`）とどれか、ID を並べるとすべてに合うときに合う。
  checkbox は `on`・`off` の値か `true` / `false`。式は書けない
- 書けるのはボタン（`reset` も）・`group`・`buttons`・select・radio・checkbox。`group`・`buttons` に書くと中の項目も変わる
- 値が変わるとすぐに切り替える。JS の `ctx.disable` とは、どちらかが押せなくすれば押せない
- 無い ID・選択肢に無い値は、その項目をエラーにする

## 4. 変数

| 変数             | 内容                                                              |
| ---------------- | ----------------------------------------------------------------- |
| `${launcherDir}` | work.launcher があるフォルダ（WorkLauncher のルート）             |
| `${workDir}`     | 作業フォルダ（`cwd` を引き継いだ結果。無ければ `${launcherDir}`） |
| `${env:NAME}`    | 環境変数 NAME（無ければ空文字と警告）                             |
| `${select:ID}`   | select・radio・checkbox の値（→ 3.8。無い ID は空文字と警告）     |

- `${launcherDir}` は置いた場所で決まり、案件ごとに書き換えない。`${workDir}` は案件ごとに最上位の `cwd` で決める
  （例: ポータブル版を `tools/launcher/` に置き、`cwd: ../..` でリポジトリのルートを作業フォルダにする）
- `cwd` は項目 → ページ → 最上位の順に引き継ぐ。項目の `cwd` は実行系だけなので、ほかの項目（open・url・function など）は
  ページ → 最上位、`style` は最上位の `cwd` になる
- `cwd` の中では `${workDir}` は置き換えない（自分自身を指すため）
- 相対パスの起点: `open`・`excel`・`powerpoint`・`word` は `${workDir}`、それ以外（`md`・`style`・`scripts`・`include`・`cwd`）は `${launcherDir}`

- 置き換える場所: パス（`excel`・`powerpoint`・`word`・`open`・`md` のファイル）・実行系の本文・`cwd`・
  `env` の値・`url`・`params` の値
- `${select:ID}` はボタンを押したときの値で置き換える。`cwd`・`md` のファイル・`style` では置き換えずに残す。
  `confirm` の確認文では `${select:ID}` だけを置き換える
- **この4つの形だけを置き換え、それ以外の `${...}` はそのまま残す**
  （sh の `${HOME}` などとぶつけないため）
- そのまま `${launcherDir}` と書きたいときは `$${launcherDir}` と書く
- 置き換えた値は引用符で囲まない。空白を含みうるパスはスクリプト側で `"${workDir}/a b"` のように囲む
- パス中の区切りは `/` と `\` のどちらでもよい（OS に合わせて直す）

## 5. ローカル設定の合成

`config.local.yaml` を `config.yaml` に重ねる。書き方は同じ（`version` は省略可）。

| ローカルに書いたもの            | 結果                                  |
| ------------------------------- | ------------------------------------- |
| 既存と同じ ID のページ          | `items` を後ろに追加                  |
| 同上 + `replace: true`          | そのページの `items` を丸ごと置き換え |
| 既存と同じ `id` の項目          | その項目を同じ位置で置き換え（※）     |
| 新しい ID のページ              | 最後に追加                            |
| ページの `title`・`icon`・`cwd` | 上書き                                |
| `title`・`cwd`・`openSchemes`   | 上書き                                |
| `style`                         | 案件の CSS の後に当てる               |
| `scripts`                       | 後ろに追加                            |
| `info.env`・`info.tools`        | 後ろに追加（同名は上書き）（※2）      |

- ※ グループ・ボタングループの中の項目も探す。見つからなければページの最後に足す
- ※2 `info.tools` に `{ name, hidden: true }` を書くと、同じ名前のツールを出さない（→ 7章）
- ヘルプの「設定ファイルの編集」のボタンで、`config.local.yaml` の雛形を作れる。作れたとき・既にファイルがあるとき（作らない＝上書きしない）はポップアップで知らせる。
  中身は、実行時の設定の最初のページ（`help`・`info` を除く）に md を1つ足す・新しいページ `my-page` を足す（同じ ID があれば番号を付ける）・
  Info のツールを git だけにする（git 以外を `hidden: true`、案件に git が無ければ足す）
- 設定に関わるファイル（config.yaml・ローカル・include 先・style・console）が変わったら、
  自動で読み直して画面を描き直す。開いているタブと実行中のコマンドはそのまま。`scripts` の JS は押すたびに読む
- 合成ロジックは Electron に依存させない（CLAUDE.md）

## 6. console.yaml

```yaml
rules:
  - pattern: "\\b(error|failed)\\b"
    flags: i
    level: error
  - pattern: '^WARN'
    level: warn
  - pattern: 'BUILD SUCCESS'
    level: success
    color: '#2da44e' # level の既定色を上書き
```

- 出力の**1行ごと**に上から照合し、最初に当たったルールを使う。当たらなければ `info`
- `pattern` は JavaScript の正規表現、`flags` はそのフラグ（`i` など）
- `level`: `error` / `warn` / `info` / `success` / `debug`。既定色を持ち、
  コンソールでの絞り込みと件数表示に使う
- コンソールの「警告以上」「エラーのみ」は、当たる level の行（出力・アプリのエラー・失敗や停止の終了）を出す。
  その行を含む実行は、開始と終了の行も出す。プロンプトと本文の行は「すべて」のときだけ出す
- コンソールのエラー・警告の件数は、絞り込みで当たる行と同じものを数える
- `color`: 文字色（CSS の色）。省略時は level の既定色
- 行頭のレベルが決まれば行全体をその色にする（一致部分だけ塗る指定は今は持たない）
- `launcher/console.local.yaml` を置くと、
  そのルールを**先に**照合する（個人のルールを優先）

## 7. Info ページ

```yaml
info:
  drives: true # 省略時 true
  env: [JAVA_HOME, PATH]
  tools:
    - git # 組み込みの取り方を使う
    - node
    - name: Maven
      command: mvn -v
      pattern: "Apache Maven ([\\d.]+)" # 1つ目のグループを表示。省略時は出力1行目
  registry: # Windows だけ
    - HKLM\SYSTEM\CurrentControlSet\Control\FileSystem\LongPathsEnabled
    - name: JDK
      path: HKLM\SOFTWARE\JavaSoft\JDK\CurrentVersion
```

- 常に表示する: OS（名前・バージョン・ビルド・アーキテクチャ）・言語・コンピュータ名・ユーザー名・CPU・
  メモリ（全体・使用中）・GPU・IP アドレス（ネットワーク部品ごとの IPv4。169.254.x.x は出さない）
  - 言語は表示言語・地域を1行にまとめる。Windows ではシステムロケール（コンソールのコードページ付き）も出す
    （例: `表示 ja・地域 ja-JP・システム ja-JP（cp932）`）
  - メモリは OS が使える量。Windows では内訳（1枚ずつの容量・種類と速度・スロット）を2行目に出す
  - GPU は、Mac ではモデル・コア数・Metal のバージョン。Windows ではモデルとドライバーのバージョン
    （`Ver. 572.16 / 32.0.15.7216` のように NVIDIA の表記と Windows の表記を並べる）。
    画面ではモデル名と括弧書きを2行に分け、コピー用のテキストでは1行にする
- `drives`: ローカルとネットワークドライブの空き容量（Mac は Finder に出るボリューム。dmg などのディスクイメージは除く。
  Windows は固定・リムーバブル・ネットワークドライブ）
- `env`: 表示する環境変数の名前。`PATH` は1行に1つずつ出す
- `tools`: 名前だけなら組み込みの取り方を使う。組み込みに無い名前は `command` が必須
  - 組み込み（初期）: `git`・`java`・`dotnet`・`go`・`rust`（`rustc` のバージョン）・`node`・`npm`・`python`（Mac は `python3`、Windows は `py` を先に試す）・`ruby`・`php`・`docker`
  - Windows と Mac だけの組み込み: `steam`（「Steam について」に出るクライアントのバージョン）・`epic`（Epic Games Launcher のバージョン）。
    Windows はインストール先をレジストリから探す。Mac は Epic Games Launcher のアプリ（探し方は下のアプリと同じ）と、
    Steam が初回起動で入れるクライアントを見る（一度も起動していなければ「未インストール」）。
    ほかの OS では「この OS では取れません」と出す。
    表示名は製品名（Steam・Epic Games Launcher）
  - Windows と Mac だけの組み込み（アプリ）: `vscode`（Visual Studio Code）・`claude`（Claude のデスクトップ版）・
    `antigravity`（Antigravity）・`antigravity-ide`（Antigravity IDE）・`cursor`（Cursor）。アプリの「バージョン情報」と同じ値を出す。
    Windows はアンインストール情報を表示名で探す。Mac はアプリの Info.plist を読む。アプリは `/Applications`・`~/Applications` の順に見て、無ければ Spotlight でバンドル ID から探す（好きな場所に置いたアプリも取れる。Spotlight の索引から外した場所は見つからない）。
    表示名は製品名
  - AI の CLI: `claude-code`（`claude`）・`codex-cli`（`codex`）・`gemini-cli`（`gemini`）・`copilot-cli`（GitHub Copilot CLI、`copilot`）・`antigravity-cli`（`agy`）。`--version` の出力から取る。全 OS で取れる
  - 組み込みの名前に `command`・`pattern` を書くと、取り方を上書きする（ツール側の取り方が変わり、アプリを更新できないとき）。
    `command` を書けば `command` と `pattern` をまとめて置き換え、全 OS でそのコマンドを使う。
    `pattern` だけなら組み込みのコマンドの出力から抜き出す。どちらでも表示名は組み込みのまま
  - ランチャーのフォルダで実行する（mise などで案件ごとにバージョンを切り替えていれば、そのバージョンが出る）
  - `hidden: true` を書いたツールは出さない。ローカル設定で、案件のツールを自分の PC だけ消すときに使う
    （同じ名前を上書きするので `command` は要らない）
  - 見つからない・失敗したときは「未インストール」と表示する。
    コマンドは成功して出力もあるのに `pattern` に当たらないときは「pattern が一致しません」と表示する
  - ツールの枠の下に、脆弱性の情報のサイト（Cloudflare Radar の Zero Wire、https://radar.cloudflare.com/zero-wire ）への
    リンクを常に出す。既定のブラウザで開く（`openSchemes` に `https` が無ければ開かない）。アプリからは問い合わせない
- `registry`: 表示するレジストリの値。Windows だけ表示し、ほかの OS では無視する
  - `ハイブ\キー\値の名前` で書く。ハイブは `HKLM`・`HKCU`・`HKCR`・`HKU`・`HKCC`（`HKEY_LOCAL_MACHINE` なども可）
  - `\` で終えるとキーの既定値を読む
  - 表示名は値の名前（既定値ならキーの最後の部分）。変えたいときは `{ name, path }` で書く
  - 引用符を付けずに書く（`"…"` で囲むと `\` がエスケープとして扱われる。囲むなら `'…'`）
  - バイナリは16進、複数行の文字列は1行に1つずつ出す。無い値は「（未設定）」
  - ローカル設定に同じパスを書くと、その名前で上書きする
- システムの情報は PC（コンピュータ名・ユーザー名・IP）・OS（OS・言語）・ハードウェア（CPU・メモリ・GPU）の
  3つの枠に分ける。コピー用のテキストも同じ見出しで区切る
- PC・OS・ハードウェア・ツールは横に並べ、ドライブ（1つずつ小さな枠で折り返す）・環境変数・レジストリは幅いっぱいに出す。狭ければ縦1列
- レジストリはパスを3列目に控えめに出す
- 枠ごとに、見出しの右上のボタンでその枠だけをテキストでコピーできる（中身の無い枠には出さない）
- 値はタブを開いたときと「更新」ボタンで取り直す。「テキストでコピー」で全体を貼り付け用のテキストにできる
  （WorkLauncher・Electron のバージョンも入る）
- WorkLauncher のバージョンは、Info ではなくヘッダーの右端に常に出す
- Mac では、コマンド（ツールの確認・`sh` 項目など）はログインシェルの PATH で動く
  （Finder から起動したアプリにも、ターミナルと同じ PATH を使うため）

## 8. タイトルと見た目

- 表示の言語（日本語・英語）は、ヘッダーの右端のボタンで切り替える（いまの言語を出し、押すたびに ja と en が入れ替わる）。選んだ言語はアプリが覚え（案件ごとではない）、
  選んでいなければ OS の言語に従う（日本語でなければ英語）。切り替えると、開いているすべてのウィンドウに反映する。
  コンソールにすでに出た行は書き換えない。訳すのはアプリの文言とヘルプ。設定に書いた文字は、次の言語の表で書いたときだけ言語で変わる
- 画面に出す文字は、文字列のほかに言語の表（`{ ja: …, en: … }`）でも書ける。対象は `title`（最上位・ページ）、
  `label`・`tooltip`・`confirm`、`heading`、`group` の見出し、選択肢の `label`、`md`・`html`

  ```yaml
  title: { ja: メイン, en: Main }
  items:
    - bat: deploy.bat
      label: { ja: デプロイ, en: Deploy }
    - md:
        ja: launcher/notes/setup.md # 長い本文は言語ごとにファイルを分ける
        en: launcher/notes/setup.en.md
  ```

  - 文字列なら、どの言語でもそれを出す。表なら表示中の言語の値、無ければ表の最初の値を出す（空にはしない）
  - `md` は言語を選んだあとの値を 3.4 のとおりに読む（1行で `.md` で終わればファイル）。ファイル名から自動で探すことはしない
  - 表の値が文字列でないときは、その項目のエラーにする。表のキーは ja・en 以外も書ける（使われないだけ）

- `title` はウィンドウ上部のヘッダーに小さく出し、ウィンドウタイトルにも使う。
  複数のランチャーを並べたときに、どの案件か見分けるためのもの
- `style` の CSS は画面にそのまま当てる。色を変えるだけなら次の変数を上書きするのがよい
  （クラス名は変わることがあるが、変数は互換を保つ）

  ```css
  :root {
    --header-bg: #1a7f37; /* ヘッダーの背景 */
    --header-text: #ffffff; /* ヘッダーの文字 */
  }
  ```

  | 変数                 | 対象                |
  | -------------------- | ------------------- |
  | `--header-bg`        | ヘッダーの背景      |
  | `--header-text`      | ヘッダーの文字      |
  | `--accent`           | 選択中タブ・ホバー  |
  | `--bg` / `--surface` | 背景 / ボタン・枠内 |
  | `--text` / `--muted` | 文字 / 補足の文字   |
  | `--border`           | 枠線                |

- 外部の画像・フォントは読み込まない（アプリの CSP で止まる）。画像は `data:` URL で書く

## 9. エラーの扱い

- YAML の構文エラー: ページの代わりにエラー画面を出す（ファイル名・行・内容）
- 項目単位のエラー（種類キーが無い・2つある・値の型が違うなど）: その位置にエラー表示を出し、
  ほかの項目は普通に動かす
- 未知のキーはエラーではなく警告（将来のバージョンの設定を古いアプリで開いても壊さないため）

## 10. イベント

案件を開く・閉じるときと、select などの値を変えたときに、`scripts` の関数を呼ぶ。

| 関数          | 呼ぶとき                                                         |
| ------------- | ---------------------------------------------------------------- |
| `beforeOpen`  | 案件を開くとき。画面を出す前（終わるまで画面を出さない）         |
| `afterOpen`   | 案件を開くとき。画面を出したあと                                 |
| `beforeClose` | 案件を閉じるとき。実行中のプロセスを止める前                     |
| `change` の値 | select・radio・checkbox の値を画面で変えたとき（項目ごとに書く） |

```js
// launcher/scripts/events.js（要る関数だけ中身を書く。要らない関数は消すかコメントにする）
module.exports = {
  async beforeOpen(ctx) {},
  async afterOpen(ctx) {},
  async beforeClose(ctx) {}
}
```

- サンプル案件（`examples/sample`）には、3つの関数をコメントにした `events.js` を置いている。
  使うものだけコメントを外す
- 開く・閉じるの関数は**決まった名前**で、`scripts` に並べた JS から探す（function と同じ。→ 3.2）。
  無ければ呼ばない。同じ名前が複数のファイルにあれば、呼ばずにコンソールにエラーを出す
- `ctx` は function と同じ（→ 3.2）。`ctx.select` はそのときの値（開くときは記憶した値・既定値）
- 関数は呼ぶたびに別プロセスで JS を読み直すため、関数の間でメモリ上の値は持ち越せない。
  持ち越すときはファイルに書く
- 例外が出たときはコンソールにエラーを出し、そのあとの処理（画面を出す・閉じる）は続ける

### 開く（beforeOpen・afterOpen）

- 設定を読み、select の値を決めたあとに `beforeOpen` を呼ぶ。終わるまで案件の画面の代わりに「読み込み中…」を出す
- 画面を出したあとに `afterOpen` を呼ぶ。動いている間もボタンは使える
- 案件を開くとき（読み込めたとき）に呼ぶ。設定の読み直し（ファイルの保存）では呼ばない
- `scripts` に JS がある案件で、まだ JS の実行を許可していなければ、開いた直後に確認する
  （関数があるかは JS を読まないとわからないため）。許可しなければイベントは呼ばない
- 並べたファイルが無い・JS が1つも無いときは呼ばない（省略時の `launcher/scripts/` が無いときは何も出さず、
  書いたファイルが無いときはコンソールにエラーを出す）

### 閉じる（beforeClose）

- ウィンドウを閉じる・アプリを終了するときに呼ぶ。
  順に `beforeClose` → 実行中のプロセス（実行系・function）を止める → 閉じる
- `beforeClose` が終わるまで閉じずに待つ（async なら Promise が終わるまで）。
  後片付けが終わるのを待つときは、関数の中で `await` する
- 待つ間は、待っていることと「待たずに閉じる」ボタンを出す。待つ時間の上限は無い
- アプリを終了するときは、開いているウィンドウごとに呼び、すべて閉じてから終了する

### change

```yaml
- select: target
  options: [dev, prod]
  change: onTargetChange # scripts の関数名
```

```js
module.exports = {
  onTargetChange(ctx) {
    const { id, value, previous } = ctx.changed
    ctx.log(`${id}: ${previous} → ${value}`)
  }
}
```

- select・radio・checkbox に `change: 関数名` と書くと、その項目の値を画面で変えたときに呼ぶ
- 開いたときの値の復元・設定の読み直し・JS の `ctx.set`・`ctx.reset`（→ 3.2）では呼ばない
  （開いたときの処理は `beforeOpen`・`afterOpen` に書く）
- `ctx.changed` は `{ id, value, previous }`（ID・変えたあとの値・前の値）。`ctx.select` は変えたあとの値
- 続けて変えたときは、前の関数が終わってから順に呼ぶ
- 同じ ID の項目を複数置いたときは、画面で操作した項目の `change` を呼ぶ
- 関数の探し方・JS の実行の確認・例外の扱いは function と同じ（→ 3.2）
