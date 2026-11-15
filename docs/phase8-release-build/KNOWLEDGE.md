# Phase 8 で確かめた挙動

## macOS のビルド

- ad-hoc 署名（`identity: '-'`）に hardened runtime を組み合わせると、electron-builder が
  「`disable-library-validation` の entitlement が無いと起動に失敗しうる」と警告する。
  公証しないなら hardened runtime は要らないので `hardenedRuntime: false` にした
- `fileAssociations` は Info.plist の `CFBundleDocumentTypes`（`LSHandlerRank: Owner`）になる
- ローカルで作った `.app` を一度でも起動すると LaunchServices に登録され、`.launcher` の関連付けを持っていく。
  試したあとは `lsregister -u <app>` で外す

## インストール版の実機確認（Mac）

- dmg のアプリの初回起動は「"WorkLauncher" は開いていません／Apple は…検証できませんでした」で止まる
  （ad-hoc 署名なので「壊れている」にはならない）。システム設定の「プライバシーとセキュリティ」の「このまま開く」で開けた
- dmg はマウントしたままだと `/Volumes/<名前>` のボリュームになり、`mount` では普通のディスクと見分けにくい。
  `hdiutil info` の各行の3列目がイメージのマウント先

## インストール版の実機確認（Windows 11）

- Ver. 0.0.3: SmartScreen は「詳細情報」→「実行」で越えられる。インストール・関連付け・ドロップ・
  ジャンプリストから開ける。アンインストールで関連付けも消える
- 単一インスタンスにしないと、ダブルクリック・ジャンプリストのたびに別プロセスが立ち、同じ案件でもウィンドウが増えた
- OS の「最近」（`addRecentDocument`）のジャンプリストはファイル名だけを出す（どれも `work.launcher` になる）
- `second-instance` を受けた側の `restore()`・`focus()` で、最小化していても前に出る
  （別プロセスからの前面化の制限には当たらなかった）。`setJumpList` の task 項目は、description がマウスを乗せたときに出る
- ポータブル版はロックを取らないので、インストール版を開いたままでも別のプロセス・ウィンドウで開く

## 開発環境

- VS Code の拡張から開いたシェルには `ELECTRON_RUN_AS_NODE=1` が入っている。
  ビルドしたアプリをそこから起動すると Node として動き、引数のファイルを JS として読んで落ちる。
  `open -a` も環境変数を引き継ぐため、`env -u ELECTRON_RUN_AS_NODE` を付けて起動する
- `open-file` は、アプリが起動中なら同じプロセスに届き、未起動なら起動前（ready の前）に届く

## GitHub Actions

- `macos-latest`（Apple Silicon）の runner 1台で、dmg の arm64 と x64 の両方を作れた
- `git archive --format=zip` は日本語のファイル名に UTF-8 の印（flag 0x800）を付ける。Windows で展開しても化けない
- 下書きの Release は、Publish するまでタグに紐づかない仮の URL（`untagged-…`）になる
- Node 20 で動くアクション（checkout@v4 など）は非推奨の警告が出る（2026-11 時点）

## アイコンの書き出し（Electron）

- オフスクリーンのウィンドウの `capturePage()` は返らないことがあった。`paint` イベントで絵を受け取る。
  読み込み直後の描画は中身が空のことがあるので、少し待って `invalidate()` で描き直させた絵を使う
- ウィンドウを閉じて0枚になると、`window-all-closed` を受けていなければ Electron は終了する
- Claude Code の Bash のサンドボックスの中では、Electron は子プロセスとの接続（mach port）を断られて落ちる

## 配布ファイルの大きさ（0.0.1、ローカルでビルドして比べた）

| ファイル            | 前       | 後                         |
| ------------------- | -------- | -------------------------- |
| Mac arm64 の dmg    | 123.9 MB | 108.5 MB → 89.7 MB（ULMO） |
| Windows の setup    | 123.4 MB | 113.6 MB                   |
| Windows の portable | 112.6 MB | 103.0 MB                   |

- `compression: maximum` の dmg は UDBZ（bzip2）になる。`hdiutil convert -format ULMO` で 2 割ほど小さくなる。
  変換しても ad-hoc 署名は壊れない（`codesign --verify --deep` が通る）
- Windows の残りは、ほぼ Electron 本体（WorkLauncher.exe 241 MB・dxcompiler.dll 25 MB など。展開後）
- electron-builder は Mac の上でも Windows の NSIS・portable を作れる（大きさを測るのに使える）
