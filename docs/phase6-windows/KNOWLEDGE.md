# Phase 6: 実機で確かめた挙動

## 開発環境（Windows 11）

- mise は `winget install jdx.mise` で入る。`node` をシェルから使うには
  `%LOCALAPPDATA%\mise\shims` をユーザーの PATH に足す（winget は mise 本体の PATH だけ足す）
- VS Code の拡張から開いたシェルには `ELECTRON_RUN_AS_NODE=1` が入っていることがある。
  このまま `npm run dev` すると Electron が素の Node として動き、
  `electron.app` が undefined で落ちる（`Cannot read properties of undefined (reading 'isPackaged')`）。
  `Remove-Item Env:ELECTRON_RUN_AS_NODE` で外してから起動する
- ツールを入れた直後は、起動中の VS Code（とそのターミナル）の PATH は古いまま。そこから `npm run dev` すると
  Info で「未インストール」になる。VS Code をすべて閉じて起動し直すと直る（ターミナルの開き直しでは直らない）
- Claude Code から開いたシェルには `PYTHONIOENCODING=utf-8:surrogateescape` が入っていることがある。
  このシェルで試すと Python の出力が化けないため、文字コードを確かめるときは外してから試す
- 同じアプリを2つ起動すると、後から起動した方はキャッシュのフォルダ（`%APPDATA%` の下）を作れず、
  `Unable to move the cache: アクセスが拒否されました (0x5)` が並ぶ（日本語の部分は文字化けして出る）
- `npm install` で electron-winstaller の install スクリプトは allowScripts 未承認のため実行されない。
  nsis・ポータブルの配布ビルドには影響しなかった

## Office（excel・powerpoint・word）

- `Start-Process -FilePath excel`（powerpnt・winword）は App Paths から本体を見つけて開く。
  名前に空白・日本語を含むファイル（サンプルの `サンプル 仕様書.xlsx` など）も、環境変数で渡せば崩れずに開く
- readonly は、Excel の `/r` と、PowerPoint・Word の COM（`Presentations.Open`・`Documents.Open` の ReadOnly）の
  どちらでも読み取り専用で開いた

## コマンドの実行

- Windows 11 の標準は Windows PowerShell 5.1（`pwsh` は入っていない）。BOM の無い UTF-8 の .ps1 を
  コードページ（cp932）で読むため、日本語が壊れて構文エラーになる（`"日本語テスト"` → `"日本語テスチE`）
- PowerShell 5.1 の出力（stdout・stderr）は、パイプでつないでもコードページの文字コードで出る。
  BOM を付けるだけでは出力が化ける。`-Command` で `[Console]::OutputEncoding = [Text.Encoding]::UTF8` に
  してから `& 'file.ps1'` で呼ぶと、出力・エラー・構文エラーの説明まで UTF-8 で出る
- `-Command` で呼ぶと、構文エラーでも終了コードが 0 になる。`try { & file } catch { exit 1 }` で拾う。
  スクリプトの `exit 3` は `exit $LASTEXITCODE` で受け渡せる
- Python が入っていない Windows でも `%LOCALAPPDATA%\Microsoft\WindowsApps\python.exe`（と python3.exe）がある。
  Microsoft Store へ案内するスタブで、引数付きで呼ぶと終了コード 9009 で終わり、出力は途切れた「Python 」だけ
- `winget install Python.Python.3.14` は python.org 版をユーザーごとに入れる（`%LOCALAPPDATA%\Programs\Python`）。
  `py` ランチャーも入り、Python のフォルダをユーザーの PATH の WindowsApps より前に足すため、スタブより先に見つかる
- Python 3.14 は、パイプへの出力を OS の文字コード（日本語の Windows なら cp932）で出す（`sys.flags.utf8_mode` は 0）。
  `PYTHONIOENCODING=utf-8` を渡すと UTF-8 になる
- bat（cp932）・sh（Git Bash）は、日本語の出力・`pause` の読み飛ばし・停止ボタンとも問題なく動いた

## Info ページ

- レジストリの `ProductName` は Windows 11 でも「Windows 10 Home」と返す。CIM の `Win32_OperatingSystem.Caption` は正しい
- PowerShell の `Get-UICulture` は、表示言語が日本語の PC で `en-US` を返した
  （`InstalledUICulture`・MUI の設定・ユーザーの言語一覧はどれも ja-JP）。
  Electron の `app.getPreferredSystemLanguages()` は `["ja"]`、`app.getSystemLocale()` は `ja-JP` で正しい
- `Win32_VideoController.DriverVersion` は Windows の表記（NVIDIA なら 32.0.15.7216。NVIDIA の表記では 572.16）
- `os.networkInterfaces()` には、つながっていないアダプター（Bluetooth・未接続のイーサネットなど）の
  169.254.x.x が出る
- `fs.statfs('C:\\')` は Windows でも使え、エクスプローラーと同じ容量・空きが出る
- `os.totalmem()` は OS が使える量で、刺さっているメモリの合計より少ない（16 GB で 15.8 GB）
- Windows PowerShell 5.1 の `ConvertFrom-Json` は、JSON の配列をパイプラインに1つのまとまりとして流す。
  `( … | ConvertFrom-Json) | ForEach-Object` と括弧でくくると1件ずつになる
- `Get-ItemProperty -Name` で読んだレジストリの値は、DWORD は数値、REG_MULTI_SZ は配列、
  REG_BINARY は byte[] になる。既定値は `-Name '(default)'` で読める
- Steam: インストール先は `HKCU\Software\Valve\Steam` の SteamPath（`/` 区切りの小文字）。
  「Steam について」に出るクライアントのバージョンは `package\steam_client_win64.manifest` の version。
  同じフォルダの `steam_client_win32.manifest` は古いバージョンのまま残っている。
  「アプリと機能」のバージョン（2.10.91.91）と steam.exe のファイルのバージョンはどちらも別物
- Epic Games Launcher: アンインストール情報のキー名は GUID。InstallLocation（`C:\Program Files\Epic Games\`）の
  `Launcher\Portal\Binaries\Win64\EpicGamesLauncher.exe` の ProductVersion がランチャーのバージョン（20.3.8-0+UE5）。
  Win32 の exe にはバージョンが入っていない。「アプリと機能」のバージョン（1.3.210.0）はインストーラーのバージョン

## 配布ビルド

- `npm run build:win` で `dist` に nsis のインストーラー（約 119 MB）・ポータブル exe（約 107 MB）・
  `win-unpacked`（約 390 MB）ができる。署名は無し（証明書を設定していないため飛ばされる）
- nsis は既定で oneClick・ユーザーごと（`%LOCALAPPDATA%\Programs`）に入る。管理者権限は要らない。
  入れたアプリに `work.launcher` を引数で渡すと、その案件が開く（別アカウントで確認）
- ポータブル exe は起動のたびに一時フォルダへ展開する。引数なしで起動してウィンドウが出るまで約9秒
  （Phase 14 で `useZip` にして約3.7秒。測った内訳は phase14 の KNOWLEDGE.md）。
  元の exe のフォルダは環境変数 `PORTABLE_EXECUTABLE_DIR` に入る（`process.execPath` は展開先）
- エクスプローラーから起動した配布版にも、ユーザーの PATH がそのまま渡る。Mac の Finder 起動のような
  PATH の違いは無く、Info のツールのバージョンも開発中と同じく取れた

## テスト

- `path.join`・`path.relative` は Windows では `\` を返す。`/` 区切りを前提にしたテストは
  Windows で落ちていたので、比較の前に `/` へ揃えるよう直した
- 実在する一時フォルダ（`C:\...`）を使うテストで `platform` に `'darwin'` を渡すと、
  posix として解決されて壊れたパスになる。そうしたテストではこの OS の `process.platform` を渡す
