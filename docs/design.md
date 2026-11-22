# 設計の決定

**いま有効な設計の決定と、その理由。** 全文は読まず、見出しで検索して節だけ読む。

- コードや [config.md](config.md) を読めば分かることは書かない。「なぜそうしたか」「採らなかった案」だけを書く
- 決定が変わったら、追記ではなく項目を書き換える。古い決定は archive に残っている
- 各項目の末尾に `（由来: [Phase N](archive/phase<N>-<slug>/PLAN.md)）` を付ける
- 項目は、フェーズを閉じるとき（`/phase-close`）か、そのトピックに触れたときに archive から拾って足す

## 設定ファイル

## 実行とスクリプト

## 画面とヘルプ

## Info

- ツールの取り方（`src/main/toolVersion.ts`）は Electron に依存させない。アプリを起動せずに同じ判定を動かす
  `scripts/check-tools.mjs` から使い、Claude が Mac・Windows で入れて消して確かめられるようにするため（由来: [Phase 28](archive/phase28-more-builtin-tools/PLAN.md)）
- 組み込みのツールはカテゴリ順（git → 開発用の言語 → スクリプト言語 → docker → ゲームのランチャー）に並べる。
  カテゴリ内を名前順にする案は、npm を node の直後に置く例外が要るので採らなかった。
  並びが効くのはヘルプの表だけで、Info は設定の `tools` の順（由来: [Phase 28](archive/phase28-more-builtin-tools/PLAN.md)）

## 多言語

## Windows / macOS

## 配布とリリース

## CI と開発の進め方

- いまの正（config.md・design.md・knowledge.md）と当時の記録（archive）を分け、記録は要約せずに移す。
  編集しない記録なら古い記述が残っても不整合にならず、要約で情報も落ちない。
  phases.md に追記していく案（覆った決定が積み重なる）と、フォルダを消して git 履歴だけに残す案（遡りにくい）は採らなかった（由来: [Phase 27](archive/phase27-archive-phase-docs/PLAN.md)）
- design.md は、トピックに触れたときに archive から拾って少しずつ育てる。phases.md は作らない
  （索引は README の表、記録は archive、いまの正は design.md なので、同じことを3箇所に書くことになる）（由来: [Phase 27](archive/phase27-archive-phase-docs/PLAN.md)）
