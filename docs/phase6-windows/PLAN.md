# Phase 6: Windows 対応

## 課題

- ここまで Mac でしか動かしていない。bat・cp932・Git Bash など Windows 向けに書いた処理を、
  実機で確かめていない（Phase 2 から持ち越し）
- `excel`・`powerpoint` は設定の読み込みまでで、押しても開かない（「まだ動かせません」を返す）
- Info ページは Mac の取り方しかない（Phase 4 で Windows を後回しにした）
- Windows 向けの配布ビルドを作っていない

## 方針

### 範囲

- `excel`・`powerpoint` を開く（Windows と Mac。`readonly` を含む）
- Phase 2 の持ち越しを Windows 実機で確かめる（bat の入力待ち・cp932・停止・Git Bash の sh）
- Info ページの Windows 対応（OS・CPU・メモリ・GPU のドライバー・ドライブ・IP）
- Windows 向けの配布ビルド（electron-builder の nsis とポータブル）を作り、入れて動かす
- 入れない: `.launcher` のダブルクリック起動（`fileAssociations`・`open-file`）。後のフェーズで扱う

### 進め方

- Windows 実機にリポジトリを clone し、`npm run dev` で動かして確かめる（ユーザー判断）
- Mac で作れるもの（excel・powerpoint の開き方の切り替え、出力の読み取りと単体テスト）は Mac で先に作り、
  Windows 実機では動作の確認と直しに絞る
- 実機で判明した挙動は KNOWLEDGE.md に書く

## 決定事項ログ

### 2026-11-14: Windows 対応をフェーズにする（ユーザー判断）

- 範囲は excel・powerpoint、Phase 2 の持ち越し確認、Info の Windows 対応、配布ビルドの4つ
- Windows では clone して `npm run dev` で確かめる。CLAUDE.md の「開発はホスト（macOS）」は
  Mac が主な開発環境という意味で残し、Windows は確認と Windows 固有の直しに使う
- ダブルクリック起動は後回し

### 2026-11-14: excel・powerpoint の開き方

- Mac では `readonly` を無視する（ユーザー判断）。Mac の Office が手元に無く確かめられないため、
  AppleScript での読み取り専用は作らない
- Mac は `open -a "Microsoft Excel"` などで開き、失敗したら（Office が無いなど）既定のアプリで開く（Claude 提案）。
  Office の無い利用者でも Numbers・Keynote などで中を見られるようにする
- Windows は PowerShell の `Start-Process` で開く。App Paths から excel・powerpnt を探せるため、
  インストール先を自分で探さない（Claude 提案）
- PowerPoint には Excel の `/r` に当たる起動オプションが無い（Microsoft の一覧に無い）。
  readonly のときは PowerShell から COM（`Presentations.Open` の ReadOnly）で開く（Claude 提案）
- 開くファイルは環境変数で PowerShell に渡す。コマンド文字列に埋めると、空白・日本語・引用符で崩れるため
- 確認用に examples/sample/docs に xlsx・pptx を置く（名前に空白と日本語を含める）

### 2026-11-14: Info ページの Windows での取り方

- OS・GPU・ドライブの一覧は PowerShell を1回呼び、CIM（`Win32_OperatingSystem`・`Win32_VideoController`・
  `Win32_LogicalDisk`）とレジストリの値を JSON で受け取る（Claude 提案）。項目ごとに呼ぶと PowerShell の起動待ちが重なるため
- OS 名は CIM の `Caption`、バージョンは `DisplayVersion`（25H2 など）、ビルドは `CurrentBuild.UBR`。
  レジストリの `ProductName` は Windows 11 でも「Windows 10」と返すため使わない
- ドライブの空きは Mac と同じく `statfs` を時間を区切って読む。CIM の Size・FreeSpace は、
  応答の無いネットワークドライブで待たされうるため使わない。種類は固定・リムーバブル・ネットワークだけ出す
- 使用中のメモリは `os.totalmem() - os.freemem()`（タスクマネージャーの「使用中」に近い）
- NVIDIA のドライバーは NVIDIA の表記と Windows の表記を両方出す（ユーザー判断）。
  NVIDIA の表記は Windows のバージョンの下5桁から作る（32.0.15.7216 → 572.16）。
  GPU の表示はすでに括弧でくくっているため、「Ver. 572.16 / 32.0.15.7216」と並べる。
  「ドライバー」と書くと長く、GPU の行なのでドライバーのバージョンと分かるため Ver. にする（ユーザー判断）
- IP から 169.254.x.x（リンクローカル）を除く。Mac・Windows 共通（ユーザー判断）。
  つながっていないアダプターに付く値で、問い合わせに貼っても役に立たないため

### 2026-11-14: メモリの内訳と OS の言語

- メモリは合計（OS が使える量）の下に、内訳を1行で出す（ユーザー判断）。
  例「8 GB × 2・DDR4-2667・スロット 2/4」。容量が違えば「8 GB + 4 GB」。
  Windows は `Win32_PhysicalMemory`・`Win32_PhysicalMemoryArray` から取る。
  Mac は手元で確かめられないため出さない（Apple シリコンは基板に載ったメモリで、枚数の考えが無い）
- 言語は表示言語・地域・システムロケールを出す（ユーザー判断）。システムロケールは Windows だけ
- 表示言語と地域は Electron（`app.getPreferredSystemLanguages`・`getSystemLocale`）から取る（Claude 提案）。
  PowerShell の `Get-UICulture` は実際の表示言語と違う値を返した（→ KNOWLEDGE.md）
- システムロケールには、コンソールのコードページ（OEM）を添える。bat の出力の文字コードはこれで決まるため
- システム欄の行は `systemRows()` にまとめ、画面とコピー用のテキストの両方から使う
- 言語は1行の「言語」にまとめる（ユーザー判断）。例「表示 ja・地域 ja-JP・システム ja-JP（cp932）」。
  3行に分けると長すぎるため。コードページは設定の `encoding: cp932` と同じ書き方にする

### 2026-11-14: レジストリの表示（Windows）

- `info.env` と同じく、見たい値を設定に並べる `info.registry` を足す（ユーザー判断）。
  Mac にレジストリは無いので、ほかの OS では無視する（plist の `defaults` は扱わない）
- 書き方は値のパスだけか `{ name, path }`（ユーザー判断）。表示名は値の名前、既定値はキーの最後の部分。
  パスが `\` で終われば既定値（Claude 提案）
- 値は Info の PowerShell 呼び出しに相乗りして読む（Claude 提案）。起動を増やさないため。
  パスは環境変数に JSON で渡す（Office と同じく、引用符・空白で崩れないように）
- ハイブは短い名前（HKLM など）と正式な名前の両方を受け付け、分からなければ読み込み時にエラーにする
- ローカル設定に同じパスを書くと、その名前で上書きする（tools と同じく位置はそのまま）
- 画面ではパスを3列目に控えめに出す（ユーザー判断）。コピー用のテキストには入れない

### 2026-11-14: システム欄を3つに分ける（ユーザー判断）

- 「システム」1枠に性質の違う9行が混ざって見づらかったため、PC（コンピュータ名・ユーザー名・IP）・
  OS（OS・言語）・ハードウェア（CPU・メモリ・GPU）に分ける。コピー用のテキストも同じ見出しで区切る
- メモリの内訳は別の行にせず、メモリの値の2行目に控えめに出す
- GPU は画面でだけモデル名と括弧書き（Ver. など）を改行して出し、コピー用のテキストは1行のままにする（ユーザー判断）。
  行は「本体」と「補足」に分けて持ち、テキストで補足をつなげるか次の行にするかを行ごとに決める
- 並びはコンピュータ名を先頭にする（ユーザー判断）

### 2026-11-14: Steam・Epic Games Launcher のバージョン（Windows）

- 組み込みツールに `steam`・`epic` を足す（ユーザー判断）。`command` で書く案は、インストール先を
  決め打ちした長い設定を案件ごとに書くことになるため採らない
- 出すバージョンはアプリの画面に出る値にする（Claude 提案）。Steam は manifest の version（「Steam について」の値）、
  Epic はランチャー本体の exe の ProductVersion。「アプリと機能」のバージョンはインストーラーのバージョンで、
  自動更新しても変わらないため使わない
- Windows だけ。Mac は手元で確かめられないため、ほかの OS では「この OS では取れません」と出す
  （「未インストール」と区別する）
- 表示名は製品名にする（Epic Games Launcher はユーザー判断、Steam はそれに合わせた）。
  設定に書く名前は短い `steam`・`epic` のまま。`command` を書いたツールは設定の name をそのまま出す

### 2026-11-14: 枠ごとのコピー（ユーザー判断）

- 各枠の見出しの右上にコピーボタンを置き、その枠だけを `[見出し]` 付きのテキストでコピーする
- 全体の「テキストでコピー」は、枠ごとのテキスト（`infoSections()`）をつなげて作る（ユーザー判断）。
  整形を2か所に持たないため
- テキストの並びは画面の枠と同じにする（ツールをハードウェアの次へ。以前はテキストだけ最後だった）

### 2026-11-14: 使い方を2通りにする（ユーザー判断）

- Phase 1 では「アプリは各 PC にインストールし、案件には設定だけを置く」としていた。これに加えて、
  **ツール本体（ポータブル exe）を設定のサンプルと一緒に案件リポジトリへコミットする**使い方も正式に扱う
  - ① リポジトリに同梱: exe をダブルクリックすると、同じフォルダの `work.launcher` を開く。
    インストールが要らず、案件ごとにツールのバージョンが固定される
  - ② インストール: Mac・Windows に1つ入れ、`work.launcher` を指定して開く（引数・ドラッグ＆ドロップ。関連付けは後のフェーズ）
- 開く案件は「起動引数 → `LAUNCHER_PROJECT` → アプリと同じフォルダ」の順に探す（→ docs/config.md）。
  ポータブル版は一時フォルダに展開して動くため、元の exe の置き場所（`PORTABLE_EXECUTABLE_DIR`）を見る
- Windows の配布ビルドは nsis（②）とポータブル（①）の両方を作る
- 未決: ①の exe（約 107 MB）を git にどう入れるか（Git LFS・.gitignore して各自が置く など）、
  ①を Mac でどう実現するか（`.app` はファイルが多いフォルダ）、ポータブル版の起動の遅さ（展開に数秒）への対処

### 2026-11-15: Mac のポータブル版と exe の入れ方は扱わない（ユーザー判断）

- ①（リポジトリに同梱）は Windows だけにする。Mac は②（インストール）で使う
- `.app` はファイルの多いフォルダで、リポジトリに入れて扱いにくいため、上の未決のうち Mac の分は取り下げる
- 上の未決のうち exe を git にどう入れるか（Git LFS など）も取り扱わない。利用者側が決めることのため

### 2026-11-14: パスの変数を launcherDir と workDir に分ける（ユーザー判断）

- `${projectDir}` は「案件（開発プロジェクト）の作業フォルダ」と取り違えやすいため、`${launcherDir}` に改名する。
  中身は変えない（`work.launcher` があるフォルダ。WorkLauncher のルート）。公開前なので旧名の互換は持たない
- 作業フォルダを指す `${workDir}` を足す。`cwd` を項目 → ページ → 最上位の順に引き継いだ結果で、無ければ `${launcherDir}`。
  ①でポータブル版をリポジトリの下のフォルダに置き、最上位の `cwd` でリポジトリのルートを指す使い方を想定する
- 設定に書く相対パスの起点は `${launcherDir}` のまま（ユーザー判断）。設定と一緒に置くファイル（docs など）の位置がぶれないため。
  作業フォルダの下を開くときは `${workDir}/out` と書く
- `cwd` の中の `${workDir}` は置き換えない（自分自身を指すため）
- function の JS も作業フォルダで動かし、`ctx` に `launcherDir`・`workDir` を渡す（Claude 提案）。
  実行系と同じく「作業フォルダで動く」にそろえるため
- コード内部の変数名・関数名（`projectDir`・`projectDirFromArgs` など）も `launcherDir` にそろえる（ユーザー判断）。
  公開前で、いまなら直せるため

### 2026-11-14: PowerShell・Python の実行の直し（ユーザー承認）

- PowerShell は一時ファイルを BOM 付きにし、`-Command` で出力を UTF-8 にしてから呼ぶ（Claude 提案）。
  BOM だけでは出力が化け、`-File` のままでは構文エラーの説明も化けるため（→ KNOWLEDGE.md）。
  コンソール側の文字コードは utf-8 のまま。構文エラーで止まったら終了コード 1 にする
- 案: PowerShell の既定の文字コードを bat と同じ cp932 にする → cp932 に無い文字が出せず、
  英語 OS ではコードページが違うため採らない
- Python は Windows で `py` を先に試し、Store のスタブ（終了コード 9009）に当たったら理由を出す（Claude 提案）。
  スタブは「見つからない」にならず実行できてしまうため、終了コードで見分ける

### 2026-11-14: markdown と mdfile を md にまとめる（ユーザー判断）

- 種類キー `markdown`・`mdfile` をなくし、`md` の1つにする（短くするため）。公開前なので互換は持たない
- 値が1行だけで `.md` で終わればファイルのパス、それ以外は本文として扱う（Claude 提案）。
  ファイルの有無で見分けると、パスを間違えたときに黙ってパスの文字が出るだけになり、気づけないため
- 弱点: `.md` で終わる1行の本文はファイルとみなされる。まれなので、句点を付けるなどで避けてもらう
- 振り分けは読み込みのときに行い、内部の種類（本文・ファイル）と表示の処理はそのまま使う

### 2026-11-14: Python の出力の文字コードと Info のバージョン

- Python の実行には `PYTHONIOENCODING=utf-8` を渡す（Claude 提案）。Windows の Python はパイプへの出力を
  cp932 で出し、コンソールの utf-8 と合わないため。利用者や項目の `env` で決めていればそちらを使う
- 案: Python の既定の文字コードを cp932 にする → 英語 OS などでコードページが違い、cp932 に無い文字も出せないため採らない
- Info のツールの `python` も、実行と同じく Windows では `py` を先に試す（ユーザー判断で Info に python を出す）
