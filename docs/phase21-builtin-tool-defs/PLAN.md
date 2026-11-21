# Phase 21: 組み込みのツールの定義をまとめる

## 課題

Info ページの組み込みツール（`git`・`node`・…・`steam`・`epic`）の定義が4か所に分かれていて、
ツールを1つ足すにも全部を直す必要がある（Phase 20 で出たユーザーの希望）。

- `src/core/load/info.ts` … 名前の一覧 `BUILTIN_TOOLS`
- `src/core/info.ts` … 対応 OS（`GAME_LAUNCHER_TOOLS`・`isUnsupportedTool`）・表示名（`BUILTIN_TOOL_LABELS`）・
  コマンドと pattern（`builtinToolCommand` の switch）
- `src/main/info.ts` … Mac の導入を促すスタブの判定（`macStubMissing` の git・python・java）
- `src/renderer/src/help/examples.ts` … ヘルプの表 `BUILTIN_TOOL_ROWS`（並びはテストで突き合わせているだけ）

## 方針

- 組み込みのツールを1ファイルの表（ツールごとに1件）にまとめ、ほかはそこから引く
- 置き場所は core（Electron に依存させない。ヘルプの画面からも読める）
- 外から見える動き（Info の表示・ヘルプの表）は変えない。既存のテストが通ることで確かめる

## 決定事項ログ

### 2026-11-21: Mac のスタブの判定も表に入れる（ユーザー判断）

- ツールを足すときに表だけ見れば済むようにするため
- 表にはスタブの場所と本体の確かめ方だけを書く。`command -v` などの実行は main に残す

### 2026-11-21: 表は `src/core/builtinTools.ts` に置き、YAML には出さない（ユーザー判断）

- ツールごとに1件（name・label・help・command・pattern・macStub）。対応 OS は command を書いた OS から決める
- 採らなかった案: 定義をサンプルの YAML に出す。直した取り方がコピー済みの案件に届かず、
  OS ごとの書き分けやスタブの判定まで設定の仕様に増えるため。案件ごとの上書きは今の `command` でできる

### 2026-11-21: 組み込みの取り方を config.yaml で上書きできるようにする（ユーザー判断）

- ツール側の取り方が変わり、アプリを更新できないときにも取れるようにするため
- `command` を書けば `command` と `pattern` をまとめて置き換える（組み込みの pattern は残さない。
  別の出力に組み込みの pattern を当てると取れなくなるため）。`pattern` だけなら組み込みのコマンドの出力から抜き出す
- `command` は1つのまま（書けば全 OS で使う）。採らなかった案: OS ごとに書き分ける。設定の仕様が増えるため
- 組み込みの名前は、上書きしても表示名を製品名のままにする（以前は command を書くと設定の name で出していた）

### 2026-11-21: Windows の実機で Info のツールが前と同じに出ることを確かめた（ユーザー確認）

- Steam・Epic も製品名とバージョンが出た。Phase 20 から「次に扱う候補」に残していた確認はこれで済んだので消す

### 2026-11-21: Mac と Windows のやりとりはフェーズの HANDOFF.md で行う（ユーザー判断）

- そのフェーズの作業として頼むことが多いため。1依頼1節、見出しに日時と向き（`mac → win`）。手順は `/handoff`
- push は依頼する側・受ける側とも、その都度ユーザーに確かめる
- 採らなかった案: リポジトリ直下の `handoff/` に1依頼1ファイル。フェーズとのつながりが見えにくい

### 2026-11-21: commit・push の前に個人情報を確かめる hook を入れる（ユーザー判断）

- `scripts/check-personal-info.mjs` を PreToolUse（`Bash|PowerShell`）から呼ぶ。見つかれば止める
- 照らし合わせる実値（ユーザー名・ホスト名）は実行時に読み、スクリプトには書かない
- コマンドの文字列そのものは見ない（コミットされないため。コミットメッセージは push の前に見る）
- 採らなかった案: git の pre-commit・pre-push。clone ごとに設定が要り、Claude Code の hook なら設定がリポジトリで共有される
