# 設計の決定

**いま有効な設計の決定と、その理由。** 全文は読まず、見出しで検索して節だけ読む。

- コードや [config.md](config.md) を読めば分かることは書かない。「なぜそうしたか」「採らなかった案」だけを書く
- 決定が変わったら、追記ではなく項目を書き換える。古い決定は archive に残っている
- 各項目の末尾に `（由来: [Phase N](archive/phase<N>-<slug>/PLAN.md)）` を付ける
- 項目は、フェーズを閉じるとき（`/phase-close`）か、そのトピックに触れたときに archive から拾って足す

## 設定ファイル

- よく使う「初期値に戻す」「値で押せなくする」は、YAML でも書けるようにする（`reset`・`enabledWhen`・`disabledWhen`）。
  関数を書くのは利用者に手間なため。はじめは JS だけにしていた（由来: [Phase 35](archive/phase35-ctx-item-state/PLAN.md)）
- 押せる・押せないの条件は「select の ID: 値」の表だけにし、式は書けない。読み違いを避けるためで、複雑な条件は関数の `ctx.disable` で書く。
  隠す機能（`hiddenWhen`）は入れない。ボタンそのものを隠すのは、管理者モードのような別の仕組みで考える（由来: [Phase 35](archive/phase35-ctx-item-state/PLAN.md)）
- 動画は扱わない。埋め込みには外部への通信と CSP をゆるめることが要り、社内やオフラインの環境では出ないため。
  開くなら `url`・`open` で足りる（由来: [Phase 37](archive/phase37-display-items/PLAN.md)）

## 実行とスクリプト

- 初期値に戻すのは `ctx.reset` にした。`ctx.set(id, null)` のように初期値を表す値を渡す案は、
  読んで意味が分かりにくく、選択肢の値とも紛れるので採らなかった（由来: [Phase 35](archive/phase35-ctx-item-state/PLAN.md)）
- 出力は 50ms ごとにまとめて画面に送る。出力の量によらず、画面の更新の回数を抑えるため（由来: [Phase 36](archive/phase36-console-bulk-output/PLAN.md)）
- 行の途中の `\r` は上書きとして、最後の分だけを残す。`\r` で書き直すプログレス表示が、1行に溜まり続けないため（由来: [Phase 36](archive/phase36-console-bulk-output/PLAN.md)）
- `function` の `wait: true` で受け取る出力には上限を付けない。途中で切れると、出力を読んで処理するスクリプトが誤るため（由来: [Phase 36](archive/phase36-console-bulk-output/PLAN.md)）

## 画面とヘルプ

- コンソールの絞り込みは実行ごとに残す。当たる行がある実行は開始・終了の行も出し、どの実行のエラーか分かるようにする。
  開始・プロンプト・終了の行にもレベルを当てて同じ基準で絞る案は、実行の見出しが消えるので採らなかった（由来: [Phase 31](archive/phase31-console-filter-fix/PLAN.md)）
- エラー・警告の件数は、絞り込みで当たる行と同じものを数える。上へ流れたエラーをスクロールせずに知るために残している。
  件数を消す案もあった（由来: [Phase 31](archive/phase31-console-filter-fix/PLAN.md)）
- コンソールの行は React を通さず、DOM に直接足す。足した行の分だけ DOM を触るので、全行の比較もコピーも起きない。
  仮想スクロールは、画面外の行が DOM に無く、選択・コピー・ページ内検索を別に作る必要があるので採らなかった（数万行で足りなくなったときの次の候補）。
  state の配列をリングバッファにする案は、DOM に直接足すなら要らない（由来: [Phase 36](archive/phase36-console-bulk-output/PLAN.md)）
- 残す行は 3 万行。2〜3 万行では画面が止まらず、5 万行では止まった。`content-visibility` はかえって止まりが長くなったので使わない（由来: [Phase 36](archive/phase36-console-bulk-output/PLAN.md)）
- 行は 500 行ずつのブロックに入れ、届いた行は1フレーム 8ms までの分だけ足す。値は計測で決めた。
  どの値も子プロセスの実行は遅くせず、変わるのは画面に出るまでだけ。1通に送る行の上限は、効果がはっきりしなかったので付けない（由来: [Phase 36](archive/phase36-console-bulk-output/PLAN.md)）
- 末尾への追従は、使う人の操作（ホイールを上・↑ / PageUp / Home・スクロールバーをつかむ）でだけやめる。
  位置から推し量る案は、古い行を消したときの位置の変化と見分けられず、Windows で外れた（由来: [Phase 36](archive/phase36-console-bulk-output/PLAN.md)）

## Info

- ツールの取り方（`src/main/toolVersion.ts`）は Electron に依存させない。アプリを起動せずに同じ判定を動かす
  `scripts/check-tools.mjs` から使い、Claude が Mac・Windows で入れて消して確かめられるようにするため（由来: [Phase 28](archive/phase28-more-builtin-tools/PLAN.md)）
- 組み込みのツールはカテゴリ順（git → 開発用の言語 → スクリプト言語 → docker → ゲームのランチャー → エディタ → AI のアプリ → AI の CLI）に並べる。
  カテゴリ内を名前順にする案は、npm を node の直後に置く例外が要るので採らなかった。
  並びが効くのはヘルプの表だけで、Info は設定の `tools` の順（由来: [Phase 28](archive/phase28-more-builtin-tools/PLAN.md)）
- アプリ（エディタ・AI のアプリ・ゲームのランチャー）は、アプリの「バージョン情報」と同じ値を出す。
  Windows はアンインストール情報を表示名で探し、Mac は `/Applications`・`~/Applications` の順に見て、無ければ Spotlight でバンドル ID から探す。
  アプリは好きな場所に置けるので、置き場所を固定しない。Spotlight だけで探す案は、索引を切った人が `/Applications` のアプリも取れなくなるので採らなかった。
  Antigravity IDE の CLI は元にした VS Code のバージョンを返すので使わない（由来: [Phase 33](archive/phase33-editor-ai-tools/PLAN.md)）
- AI の CLI の名前は、アプリと紛れないよう `-cli` を付ける（`gemini-cli` など）。`claude-code` は製品名のまま（由来: [Phase 33](archive/phase33-editor-ai-tools/PLAN.md)）

## 多言語

## Windows / macOS

## 配布とリリース

- Web サイトを出すのは、リリースの公開時と手動のときだけにする。main に入ったまま、まだ配っていない機能の説明を出さないため（由来: [Phase 29](archive/phase29-github-pages/PLAN.md)）
- リリースノートは `.github/changelog.yaml` を正にし、サイトのページと Release 本文の「主な変更」の両方を作る。
  サイト用に別に書く案（2箇所に書く）と、GitHub の本文を読んで解析する案（0.1.x に無く、書式も揃っていない）は採らなかった。
  書き忘れは、テストと release.yml の確認で止める（由来: [Phase 29](archive/phase29-github-pages/PLAN.md)）

## Web サイト

- 本文の正はアプリのヘルプにし、サイトは章を描いて、トップ・リリースノートなど Web にだけ要るページを外側に足す。
  ヘルプとサイトで構成が分かれると管理が大変なため。ヘルプを MDX にして VitePress / Starlight に載せる案
  （TSX を全部移すことになり、動く見本も扱いにくい）と、Web 用に別の文章を書く案（二重管理）は採らなかった（由来: [Phase 29](archive/phase29-github-pages/PLAN.md)）
- Astro で静的に書き出し、章の本文はブラウザで hydrate する。検索に載り、見本も動くため。
  Vite の SPA は HTML が空になるので採らなかった。依存は root に置き、React を2つにしない（由来: [Phase 29](archive/phase29-github-pages/PLAN.md)）
- JS を小さくするため、サイトのビルドでだけアプリの `icons.ts`・`embed.tsx` を差し替える。アプリは手元で動くので、読み込みの大きさは問題にならない。
  アイコンはヘルプの見本で使う分だけを入れ、使う名前はソースから拾う。lucide の `DynamicIcon`（ビルド時の HTML にアイコンが出ない）と、
  使うアイコンを手で並べる案（見本を足したときに漏れる）は採らなかった（由来: [Phase 29](archive/phase29-github-pages/PLAN.md)）
- 体験ページ（`/try/`）は、アプリの部品（`ItemList`・`InfoPage`・`useConsole`/`Console`）をそのまま描き、`window.launcher` を仮のものにして動かす
  （`getInfo` は仮の値を返し、`onRunEvent` には仮の実行の知らせを流す）。体験用に画面を作り直すと、アプリと見た目がずれるため（由来: [Phase 32](archive/phase32-try-page/PLAN.md)）
- 体験ページでは、押したボタンの YAML を自分の吹き出しに出し、説明は「アプリで起こること」だけにする（本文を繰り返さない）。
  ボタンは種類ごとの見本に絞り、select は使わない（体験には複雑なため）（由来: [Phase 32](archive/phase32-try-page/PLAN.md)）

## CI と開発の進め方

- ブランチは GitHub Flow にする。`main` 1本に PR でマージし、リリースはタグで決める（ルールは CLAUDE.md の「ブランチとリリース」）。
  一人で開発していて、リリースはすでにタグで決まり、サイトもリリースのときにしか出さない。そのため「まだ配っていない変更が `main` にある」ことの害は小さい（2026-11-28）
- 作りかけが `main` に入るのは、フェーズの親ブランチで防ぐ。`develop` と `main` の2本を常に置く案（git-flow を軽くした形）は採らなかった。
  2本の同期が要るうえ、Dependabot の向け先と Ruleset も2本分になり、一人の開発には重い（2026-11-28）
- リリースのバージョンは出す直前まで決めないため、`release/0.6` のようにブランチ名にバージョンを入れない。
  出したバージョンの修正は、要るときにタグから切る（2026-11-28）

- いまの正（config.md・design.md・knowledge.md）と当時の記録（archive）を分け、記録は要約せずに移す。
  編集しない記録なら古い記述が残っても不整合にならず、要約で情報も落ちない。
  phases.md に追記していく案（覆った決定が積み重なる）と、フォルダを消して git 履歴だけに残す案（遡りにくい）は採らなかった（由来: [Phase 27](archive/phase27-archive-phase-docs/PLAN.md)）
- design.md は、トピックに触れたときに archive から拾って少しずつ育てる。phases.md は作らない
  （索引は README の表、記録は archive、いまの正は design.md なので、同じことを3箇所に書くことになる）（由来: [Phase 27](archive/phase27-archive-phase-docs/PLAN.md)）
