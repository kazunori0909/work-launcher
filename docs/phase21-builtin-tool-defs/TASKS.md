# Phase 21 タスク

- [x] 表に持たせる項目と置き場所を決める（スタブの判定は入れる）
- [x] core に組み込みのツールの表を作る
- [x] `BUILTIN_TOOLS`・`isUnsupportedTool`・表示名・`builtinToolCommand` を表から引く形にする
- [x] main のスタブの判定を表から引く形にする
- [x] ヘルプの表を core の表から作る（突き合わせのテストは不要になれば消す）
- [x] テスト（各 OS のコマンド・表示名・対応 OS が変わっていないこと）
- [x] AGENTS.md の地図に表のファイルを足す
- [x] 実機で Info ページとヘルプの表が前と同じに出るか確かめる
- [x] 組み込みの取り方を config.yaml で上書きできるようにする（pattern だけでも効く・表示名は製品名のまま）
- [x] config.md とヘルプに上書きの書き方を足す
- [x] 実機で上書き（pattern だけ・command）が効くか確かめる
- [x] Windows の実機で Info のツール（git・node・python・java・Steam・Epic）が前と同じに出る
- [x] Windows の実機で上書き（pattern だけ・command）が効く
- [x] Windows の実機でヘルプの Info の章（表・上書きの説明）が崩れずに出る
- [x] 個人情報チェックの hook が Windows でも動く（Bash ツール）
- [x] PowerShell ツールでも hook が走る
- [x] 出力はあるのに pattern に当たらないときは「pattern が一致しません」と出す（Mac の実機で確認）

## 共通

- [x] 個人情報チェック（追跡ファイルに実値が混入していないか）
