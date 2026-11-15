# Phase 8 タスク

- [x] mac のアーキテクチャ・動かすきっかけ・公開の予定・署名・publish を決める

### 案件の開き方

- [x] メインプロセスを「ウィンドウごとに案件」にする（IPC・画像のプロトコル・設定の見張り）
- [x] 案件が決まらないときの開始画面（「案件を開く…」と最近開いた案件）
- [x] 「案件を開く…」のメニュー（⌘O / Ctrl+O）とダイアログ
- [x] 最近開いた案件を保存し、OS の最近使った項目にも足す
- [x] Mac の `open-file`（起動前に届いた分も。ローカルの .app で起動中・未起動の両方を確認）
- [x] `.launcher` の関連付け（electron-builder の `fileAssociations`）
- [x] ヘルプ・docs/config.md の「使い方」を直す

### ビルドと配布

- [x] アプリとファイル（`work.launcher`）のアイコンを作る（`npm run icons`）
- [x] アプリに入れるファイルを、入れるものだけの列挙にする
- [x] アイコンの見た目の確認（ユーザー確認）
- [x] リリースノートの冒頭にダウンロードの案内を入れる（`.github/release-notes.md`）
- [x] 配布ファイルを小さくする（画面のライブラリを devDependencies へ・言語ファイル・圧縮・dmg を ULMO に）

- [x] `electron-builder.yml` を直す（`publish` を消す・mac は dmg を arm64 と x64・ad-hoc 署名）
- [x] `.github/workflows/` に Windows・macOS の matrix ビルドを置く（Node は `mise.toml` に揃える）
- [x] サンプル案件の zip を Release に添付する
- [x] タグの push で下書きのリリースに exe・dmg・zip が添付されることを確かめる（v0.0.1）
- [x] 画面の確認: 複数のウィンドウを開ける（ユーザー確認）
- [x] 画面の確認: 開始画面・最近開いた案件・同じ案件で前に出る・Dock の「新規ウィンドウ」（ユーザー確認）
- [x] Mac の実機で、ダウンロードしたものがインストール・起動でき、アイコンが付く（v0.0.2。ユーザー確認）
- [x] Windows の実機で、インストール・起動・関連付けで開けることを確かめる（Ver. 0.0.3。ユーザー確認）
- [x] Windows のインストール版を単一インスタンスにする（同じ案件は前に出す）
- [x] Windows のジャンプリストを自前で作り、フォルダ名で出す
- [x] Windows の実機で、上の2つを確かめる（ユーザー確認）
- [x] Windows の実機で、ポータブル版が動くことを確かめる（ユーザー確認）
- [x] リリースの手順（バージョンの上げ方・タグ・Publish）と初回起動の警告の越え方を README に書く

### ライセンス

- [x] ライセンスを決める（MIT。ユーザー判断）
- [x] `LICENSE` を置き、`package.json` の `license`・`author`・`homepage`・`repository` を直す
- [x] アプリに入るライブラリのライセンス文をビルドで集める（`scripts/licenses.mjs`）
- [x] ヘルプに「このアプリについて > ライセンス」を足す
- [x] 配布物に `LICENSE.txt`・`LICENSE.electron.txt`・`LICENSES.chromium.html` が入ることを確かめる（Mac の `--dir`）
- [x] 画面の確認: ヘルプのライセンスの章（ビルドしたアプリで。ユーザー確認）

## 共通

- [x] 実機調査で判明した挙動・制約を KNOWLEDGE.md に記録
- [x] 個人情報チェック（追跡ファイルに実値が混入していないか）
