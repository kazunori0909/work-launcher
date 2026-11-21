# Phase 11: リファクタリング（構成の整理とテストの軽量化）

## 課題

機能を足すたびに触る場所が増えてきた。動きは変えずに、次の機能（Phase 10 のイベントなど）を足しやすい形にする。
2026-11-15 時点の調査で見つけたこと（テスト 142 件・約 0.55 秒、lint・typecheck は通っている）:

1. **IPC の名前と型が3か所に分かれている**
   - チャンネル名の文字列（`'item:activate'` など 13 個と、通知 2 個）を `src/main/*.ts` と `src/preload/index.ts` の両方に書いている
   - 型は `src/preload/index.d.ts` にあり、メイン（`actions.ts`・`runs.ts`）がプリロードの型を読んでいる（向きが逆）
   - メイン側の引数は `pageId: string` と書いているだけで、確かめ方がハンドラごとに違う
     （`runs.ts` は `isRecord`、`actions.ts` はキャスト）
2. **メインの状態がモジュールごとの変数に散っている**
   - ウィンドウは `windows.ts` の `windows`、実行中のプロセスは `runs.ts` の `runs`、function の子プロセスは
     `actions.ts` の中だけ。「このウィンドウで動いているものを全部止める」が1か所で書けない（Phase 10 の終了イベントで要る）
   - `run:event` を送る `send` が `runs.ts` と `actions.ts` に同じ形である
   - `userData` に置く JSON（`recent.json`・`selections.json`・`trusted-projects.json`）の読み書きを3回書いている
   - JS の関数を呼ぶ処理（`callFunction`）が `actions.ts` の中にあり、ボタン以外（イベント）から呼びにくい
3. **項目の種類を1つ足すと、6〜7ファイルを触る**
   - `types.ts`、`load.ts`（`TYPE_KEYS`・`EXTRA_KEYS`・`OWN_KEYS`・170 行の `switch`）、`items.ts`（`itemLabel`・`defaultIcon`）、
     `actions.ts`、`PageView.tsx`、`help/examples.ts`、`docs/config.md`
   - `switch` の `default:` が新しい種類を飲み込むため、足し忘れを型で気づけない
     （`itemLabel` は `item.path`、`actions.ts` は「まだ動かせません」、`PageView.tsx` はボタンになる）
   - `load.ts` は 590 行で、YAML の読み方・項目・Info・コンソールのルールが1ファイルにある
4. **画面は `App.tsx` に状態が集まっている**（327 行）
   - 案件の読み込み・ページの選択・コンソールの行・実行中の一覧・select の値・リンクを1つの関数で持つ
   - `HelpPage.tsx` は 753 行で、全部の章が1ファイルにある。`main.css` は 1056 行で1ファイル
   - 画面側のロジック（実行イベント → コンソールの行、ページの並べ方、select の値の決め方）にテストが無い
5. **テストと CI**
   - テストは速い（全体の 8 割が、実際にプロセスを動かす `runner.test.ts` の約 0.36 秒）。軽くしたいのは時間ではなく**書く量**
   - `load.test.ts`（498 行）は `version: 1 / pages: / - id: top / items:` の前置きを 15 回書いている
   - テストが走るのはリリース（タグ）のときだけ。Windows でだけ流す 3 件は、ふだん一度も走らない
   - `build:mac` は typecheck を通らない（`build:win` は通る）。lint は CI で走らない
   - vitest の設定が無く、どこを探すかは既定まかせ（`out/`・`dist/` を除く指定が無い）
6. **`sandbox: false`**（`windows.ts`）。プリロードは `contextBridge` と `ipcRenderer` しか使っていないので、外せる見込み

## 方針

- **動きは変えない。** 設定ファイルの書き方・画面・エラーの文言は、このフェーズでは変えない
  （変わるのは F の `sandbox` だけ。実機で確かめる）
- **小さく刻む。** 下の A〜F は独立に終えられる。1つ終えるたびに `npm run lint && npm run typecheck && npm test` を通す
- **実行時の依存は増やさない。** いまは `yaml`・`iconv-lite`・`@electron-toolkit/utils` の3つだけ。開発用の依存は要るものだけ足す
- **先にテストで動きを固定してから動かす**（C の前にサンプル案件の読み込み結果を固定する、など）
- 構成の考え方は、いまの「`core`（Electron なしでテストできる）＋ 薄い `main`」を保ち、境界をはっきりさせる
  （Electron でいまよく採られる形: 型つきの IPC の約束・ウィンドウごとのセッション・sandbox・ロジックを純粋な関数に寄せる）

### A. IPC の約束を1か所にする（`src/core/ipc.ts`）

- チャンネルごとの「引数と戻り値」と、通知（`run:event`・`project:changed`）の型を1つの型にまとめる。
  `RunEvent`・`LauncherApi` も `preload/index.d.ts` からここへ移す（`index.d.ts` は `Window` の宣言だけ残す）
- プリロードは、その型から `invoke` を作る（チャンネル名を型で確かめる）。メインは `handle(channel, fn)` の薄い包みで登録し、
  名前の打ち間違いと戻り値の違いを型で止める
- 画面から来る引数は信用しない前提のまま、確かめる関数（`pageId`・`path`・`select`）を1か所に置いて全部のハンドラで使う
- 外部のライブラリ（electron-trpc など）は足さない。15 チャンネルなら型だけで足りる

### B. メインをウィンドウごとのセッションにまとめる

- `windows.ts` の `ProjectWindow` を広げ、そのウィンドウの案件・見張り・**実行中のプロセス・function の子プロセス**を持たせる。
  「全部止める」を1つのメソッドにする（閉じたとき・Phase 10 の終了イベントの置き場所になる）
- `run:event` を送る処理をセッションの1つのメソッドにする
- `callFunction` を `main/scriptCall.ts` に出す（ボタンからもイベントからも呼べる形。引数は関数名と `ctx`）
- `userData` の JSON の読み書きを `main/jsonStore.ts` にまとめ、`recent`・`selections`・`trust` から使う
- 「どのウィンドウで開くか」（`openProject` の分岐）を、ウィンドウの一覧を受け取る純粋な関数にして `core` に置き、テストする

### C. 項目の種類の定義を寄せる

- `load.ts` を `core/load/` に分ける: YAML と共通の読み方 / 項目 / Info / コンソールのルール。
  外から見える名前（`loadProject`・`loadConsoleRules`・定数）は変えない
- 項目は「種類ごとの表」にする。1つの種類につき、種類キー・書けるキー・読み方（いまの `case` の中身）を並べ、
  `TYPE_KEYS`・`EXTRA_KEYS`・`OWN_KEYS` は表から作る
- `items.ts`・`actions.ts`・`PageView.tsx` の `switch` は `default:` で受けず、全部の種類を書いて `never` で確かめる
  （種類を足したとき、直す場所をコンパイルエラーが教える）
- 検証は手書きのままにする（下の「採らない案」）

### D. 画面を hook と小さい部品に分ける

- `App.tsx` から状態ごとに hook を出す: `useProjectView`（読み込みと変更の通知）、
  `useConsole`（行・実行中の一覧・開閉）、`useSelections`（select の値）
- hook の中身は純粋な関数に寄せて `core` でテストする:
  実行イベント → コンソールの行（`promptLines`・終了の文言を含む）、ページの並べ方（`info`・`help`・`top` の扱い）、
  select の値の決め方（選んだ値 → 記憶 → 既定値）
- `HelpPage.tsx` は章ごとのファイル（`help/sections/`）に分け、`HelpPage.tsx` は目次と切り替えだけにする
- `main.css` は画面ごとのファイルに分け、部品から読む。**クラス名と CSS 変数は変えない**
  （案件の `style` が当たるため。CSS Modules のように名前が変わる仕組みは使わない）

### E. テストを軽くする・足す

- `vitest.config.ts` を置く（探す場所を `src/**/*.test.ts` に限る）
- `load.test.ts` に「項目の YAML だけ渡す」助けの関数を置き、前置きの繰り返しを消す（`examples.test.ts` と共通にする）。
  「この書き方 → このエラー」の並びは `it.each` の表にする
- C の前に、`examples/sample` を読んだ結果（Project と diagnostics）を固定するテストを足す
- A〜D で純粋な関数にしたものにテストを足す（ウィンドウの選び方・コンソールの行・ページの並べ方・select の値・JSON の読み書き）
- カバレッジ（`@vitest/coverage-v8`、開発用）を `npm run coverage` で見られるようにする。しきい値は置かない
  （`merge.ts` のように専用のテストが無い場所を見つけるため）
- `build:mac` も typecheck を通す
- push・PR の CI（lint・typecheck・test を Mac と Windows で流す）は、このフェーズでは足さない（決定事項ログ）

### F. sandbox を有効にする

- `webPreferences.sandbox` を `true` にする（プリロードが sandbox で動く形で出力されているかを先に確かめる）
- 動きが変わりうるので最後にやり、Mac と Windows の実機で一通り押して確かめる。結果は KNOWLEDGE.md に書く

## 実装で決めたこと（作業中のメモ）

計画から外れたところと、計画に無かったもの。

- **CSS は部品から読まず、`main.css` に `@import` を元の順に並べた**。部品ごとに読むと、読み込む順が
  モジュールの順になり、後勝ちの規則が変わるおそれがあるため。ビルドした CSS はコメントと空白を除けば分割前と同じ
- **ヘルプは「表示中の章だけを描く」Context をやめ、章の表（`SECTION_GROUPS`）から表示中の章の部品だけを描く**
- **`main/open.ts` を足した**。`callFunction`（`scriptCall.ts`）と `actions.ts`・`links.ts` の両方から
  ファイル・URL を開くため、循環しないように分けた
- **`run:stop` はウィンドウのセッションの中だけを探す**（ほかのウィンドウの実行は止められない）
- **vitest を `isolate: false` にした**（全体で 0.9 秒 → 0.55 秒）。モジュールの状態を書き換えるテストは書かない前提
- **`project:load` の戻り値の型を `ProjectView | undefined` にした**（ウィンドウが見つからないときの実際の動きに合わせた）

## 採らない案

- **Zod・Valibot で設定を検証する**: 型と検証を1つにできるが、いまの「項目ごとにエラーを出して他は生かす」
  「日本語の文言」「未知のキーは警告」を保つには結局手書きが要り、実行時の依存も増える。表にすれば足りる
- **状態管理のライブラリ（Zustand など）**: 状態は `App` の下だけで、hook で分ければ足りる
- **画面の DOM テスト・E2E（Playwright）**: 遅く、壊れやすい。ロジックを純粋な関数に出して `core` でテストする方を選ぶ
- **ESLint・Prettier を別のツール（Biome・Oxlint）に替える**: いま困っていない
- **import の別名（`@core`）を足す**: 全ファイルが変わるわりに得るものが少ない

## 進め方（作業する人へ）

- 順番は **E の前半（vitest の設定・サンプルの固定）→ A → B → C → D → E の残り → F**。
  A・B は Phase 10 の土台なので、ここまでで一度止めて Phase 10 に移ってもよい
- 1つの項目（TASKS.md の1行）を1コミットの大きさにする。コミットは言われたときだけ行う
- ファイルを移すときは、移すだけの変更と中身を変える変更を分ける（差分を読めるようにするため）
- 文言・設定の書き方・クラス名が変わる変更が必要になったら、やらずにユーザーに聞く
- `AGENTS.md` のフォルダ構成は、フォルダを足した時点で直す

## 決定事項ログ

### 2026-11-15: 計画を先に作り、実装は別に進める（ユーザー決定）

- リファクタリングの提案と計画をこのフェーズにまとめ、実装は Opus に任せる
- 構成の提案に加えて、テストコードの軽量化・最適化も対象にする

### 2026-11-15: Phase 10 より先に A・B をやる（ユーザー決定）

- Phase 10 はまだコードに入っておらず、イベントは A・B で整える場所
  （関数の呼び出し・ウィンドウの終了・select の変更）にそのまま乗るため
- A・B を終えたところで一度止めて、Phase 10 に移ってもよい

### 2026-11-15: React Compiler はこのフェーズでは入れない（ユーザー決定）

- `useMemo`・`useCallback` は 16 か所。D で hook に分けたあとに残った数を見て、あらためて決める
- 入れるなら `@vitejs/plugin-react` 6 での設定の仕方を調べるところから

### 2026-11-15: 設定ファイルの JSON Schema はこのフェーズでは作らない（ユーザー決定）

- やる価値はある（エディタで補完と誤りの指摘が出る）。C の表ができたあとに作りやすくなるので、
  `docs/README.md` の「次に扱う候補」に置いた

### 2026-11-15: sandbox はこのフェーズの最後にやる（ユーザー決定）

- F はこのフェーズに含める。動きが変わりうるので最後にやり、Mac と Windows の実機で確かめる

### 2026-11-15: push・PR の CI は、リポジトリを公開したあとにする（ユーザー決定）

- いまはプライベートリポジトリで、Actions の実行時間に限りがあるため
- `docs/README.md` の「次に扱う候補」に置いた。それまで、Windows でだけ流すテストはリリースのビルドで走る

### 2026-11-15: カバレッジ用の開発依存を足す（ユーザー決定）

- `@vitest/coverage-v8` を開発用に足し、`npm run coverage` で見る。しきい値は置かない
