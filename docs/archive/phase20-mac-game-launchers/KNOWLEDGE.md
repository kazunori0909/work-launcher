# Phase 20 で確かめたこと

- Mac の Steam: `/Applications/Steam.app` はブートストラッパー（Info.plist の CFBundleVersion は 6.0）。
  一度起動するとクライアントが `~/Library/Application Support/Steam/Steam.AppBundle/Steam/Contents/MacOS/package/`
  に入り、`steam_client_osx.manifest` の version が「Steam について」の値。形は Windows の manifest と同じ。
  起動前はこのフォルダが無い
- Mac の Epic Games Launcher: バンドル ID は `com.epicgames.eglv2`。Info.plist の CFBundleShortVersionString
  （0.117.0）がアプリ内の表示と同じ。Windows のランチャー（20.3.8-0+UE5）とは番号の系統が違う
