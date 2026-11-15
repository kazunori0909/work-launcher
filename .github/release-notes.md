## ダウンロード / Download

| ファイル / File                                         | 対象 / For                                             |
| ------------------------------------------------------- | ------------------------------------------------------ |
| `work-launcher-{{version}}-win-x64-setup.exe`           | Windows（インストール版 / installer）                  |
| `work-launcher-{{version}}-win-x64-portable.exe`        | Windows（ポータブル版。インストール不要 / no install） |
| `work-launcher-{{version}}-mac-apple-silicon-arm64.dmg` | Mac（Apple Silicon: M1 以降 / M1 or later）            |
| `work-launcher-{{version}}-mac-intel-x64.dmg`           | Mac（Intel）                                           |
| `work-launcher-sample-{{version}}.zip`                  | サンプル案件 / Sample project                          |

### サンプル案件の使い方 / Using the sample

1. `work-launcher-sample-{{version}}.zip` を展開する（`sample` フォルダができます）
2. 開き方
   - インストール版: `sample/work.launcher` をダブルクリックする（アプリの「案件を開く…」で選んでもよい）
   - ポータブル版: `…-portable.exe` を `sample` フォルダの `work.launcher` の隣に置き、ダブルクリックする
3. ボタンの中身は `sample/launcher/config.yaml` に書いてあります。書き換えて保存すると、画面にすぐ反映されます。
   書き方はアプリの「ヘルプ」タブを見てください

### 補足 / Notes

- Mac の種類は「Apple メニュー > この Mac について」で分かります。「チップ: Apple M…」なら Apple Silicon、「プロセッサ: … Intel …」なら Intel です
- アプリには署名がないため、初回の起動で警告が出ます。越え方は [README](https://github.com/{{repo}}#インストール) を見てください
- `SHA256SUMS.txt` はファイルのハッシュです。Windows は `certutil -hashfile <ファイル> SHA256`、Mac は `shasum -a 256 <ファイル>` で比べられます
- このリポジトリのワークフローでビルドしたものかは、`gh attestation verify <ファイル> -R {{repo}}` で確かめられます
- 「Source code」は GitHub が自動で付けるソースコードで、アプリではありません
