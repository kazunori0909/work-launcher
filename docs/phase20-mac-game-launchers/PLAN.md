# Phase 20: Mac の Steam・Epic Games Launcher

## 課題

Info ページの組み込みツール `steam`・`epic` は Windows だけで、Mac では「この OS では取れません」と出ていた。

## 方針

- Windows と同じく「アプリの画面に出る値」を出す（→ phase6-windows の決定）
- Steam: 初回起動でクライアントが Application Support に入る。その `steam_client_osx.manifest` の version を読む。
  `/Applications/Steam.app` はブートストラッパーで、Info.plist のバージョンは別物
- Epic: `/Applications/Epic Games Launcher.app` の Info.plist の CFBundleShortVersionString
- 「この OS では取れません」は Windows・Mac 以外に残す（`isUnsupportedTool`）
- 採らなかった案: Spotlight（mdfind）でアプリの場所を探す。既定の置き場所で足りるので見送り

## 決定事項ログ

### 2026-11-19: Mac の Steam・Epic のバージョンの取り方

- Steam は実物を起動して manifest の場所と値を確かめてから実装する（ユーザー判断）
- Epic は Info.plist の値（0.117.0）がアプリ内の表示と同じことをユーザーが確かめた

### 2026-11-21: Windows の実機での確認は残してフェーズを閉じる（ユーザー判断）

- Windows の取り方は変えていないため。確認は「次に扱う候補」へ移す
- ヘルプの Info の章に組み込みのツールの一覧表を足した（表の名前は core の BUILTIN_TOOLS とテストで突き合わせる）
- ツールごとの取り方（コマンド・pattern・表示名・対応 OS・ヘルプの説明）が core とヘルプに分かれている。
  1ファイルにまとめ、ツールを足すときはそこだけ直せばよい形にしたい（ユーザーの希望。「次に扱う候補」へ）
