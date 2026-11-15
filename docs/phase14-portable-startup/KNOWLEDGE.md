# Phase 14: 実機で確かめたこと

## 起動時間（Windows 11・Ver.0.1.1・2026-11-15）

引数なしで起動して、WorkLauncher のウィンドウが見えるまで。各3回（Defender のリアルタイム保護は有効）。

| 起動したもの              | exe の大きさ | 時間        |
| ------------------------- | ------------ | ----------- |
| `win-unpacked` の exe     | （展開なし） | 0.9〜1.6 秒 |
| ポータブル版（`maximum`） | 98.5 MB      | 8.0〜8.2 秒 |
| ポータブル版（`normal`）  | 98.5 MB      | 7.7〜8.1 秒 |
| ポータブル版（`useZip`）  | 140 MB       | 3.7 秒※     |
| ポータブル版（`store`）   | 315 MB       | 2.8〜3.0 秒 |

※ `useZip` は1回目だけ 6.7 秒。新しい exe を初めて開いたときの検査と思われる

- 遅さのほとんどは展開（解凍）。`normal` と `maximum` は大きさも時間もほぼ同じ
- `win-unpacked`（24 ファイル・314 MB）を一時フォルダへ普通にコピーすると 0.15 秒。
  `store` で残る約2秒は、NSIS の書き出しか exe 自体の検査で、ファイルを書く量そのものではない
- Defender の除外を足して比べることはしていない（セキュリティ設定を変えるため）

## electron-builder の portable（26.18.0）

- 使うスクリプトは内蔵の `templates/nsis/portable.nsi` に固定。`nsis.script`・`include` は portable には効かない
- 起動のたびに `RMDir /r` してから展開し、アプリが終わるとまた `RMDir /r` する。
  `unpackDirName` は展開先の名前を変えるだけで、展開済みでも飛ばさない
- `unpackDirName` の既定はビルドごとの KSUID。同じ exe なら毎回同じフォルダ名（`%TEMP%\<KSUID>`）になる。
  `false` にすると起動ごとの `$PLUGINSDIR\app`
- `portable.useZip: true` で、埋め込む中身を 7z（LZMA）でなく zip にできる

## `useZip: true` を入れたあと（2026-11-15）

- 配布用の設定（`electron-builder.yml`）で作った exe は 140 MB。5回測って 1回目 6.8 秒、2〜5回目 3.7 秒
