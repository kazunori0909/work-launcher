# WorkLauncher 開発ドキュメント

このディレクトリには、開発フェーズごとの計画・作業記録を格納する。
構成は [AGENTS.md](../AGENTS.md)、開発ルールは [CLAUDE.md](../CLAUDE.md) を参照。

進行中のフェーズは `docs/phase<N>-<slug>/` に以下を持つ:

- `PLAN.md` — 設計上の選択とその理由
- `TASKS.md` — 作業チェックリスト
- `KNOWLEDGE.md`（任意）— 実機・OS・外部ツールで判明した挙動・制約
- `HANDOFF.md`（任意）— Mac と Windows の Claude どうしの依頼と回答（`/handoff`）

完了したフェーズは `/phase-close`（ユーザーが明示的に指示したときのみ）で閉じる。

- いまも有効でコードに表れない決定は [design.md](design.md)、OS の挙動は [knowledge.md](knowledge.md) の
  トピックへ書き換えて反映する（**いまの正**）
- フォルダは要約せずに `archive/` へ移し、以後は編集しない（**当時の記録**）。経緯を遡るときだけ開く

新規フェーズの追加は `/phase-new` で行う。

## 開発フェーズ記録

**この表は Phase 番号の索引。** 当時の記録は `archive/phase<N>-*/` にある。

- **🚧** … 進行中。`docs/phase<N>-<slug>/` に PLAN.md・TASKS.md がある
- 要点は1行の見分けが付く程度にとどめる

| #   | フェーズ            | 要点                                   |
| --- | ------------------- | -------------------------------------- |
| 1   | 全体設計 ✅         | 技術選定と設定ファイルの書き方を決める |
| 2   | 最小構成の実装 ✅   | 設定読み込み・実行・コンソール         |
| 3   | Markdown の表示 ✅  | 埋め込み md・html とヘルプの章立て     |
| 4   | Info ページ ✅      | Mac の情報を表示する                   |
| 5   | 設定の分離 ✅       | 起動用ファイルと設定 YAML を分ける     |
| 6   | Windows 対応 ✅     | Office・bat・Info を Windows で動かす  |
| 7   | 設定フォルダ ✅     | `.launcher/` を `launcher/` にする     |
| 8   | リリースビルド ✅   | Actions でビルドし Releases で配る     |
| 9   | グループと選択 ✅   | 枠・ボタングループ・select             |
| 10  | イベント ✅         | change・起動・終了の前後に関数を呼ぶ   |
| 11  | リファクタリング ✅ | 構成の整理とテストの軽量化             |
| 12  | 公開の準備 ✅       | 作り直しと GitHub のセキュリティ設定   |
| 13  | URL のスキーム ✅   | 外部に開くスキームを許可リストで絞る   |
| 14  | ポータブル起動 ✅   | zip で埋め込み、約8秒を約3.7秒にした   |
| 15  | コードの色付け ✅   | ヘルプのコード見本に highlight.js で色 |
| 16  | md のコード ✅      | md のコードの色・インラインの折り返し  |
| 17  | CI の絞り込み ✅    | docs だけの変更では check を飛ばす     |
| 18  | 関数から項目 ✅     | ctx から url・Office・実行系を呼ぶ     |
| 19  | CI の重複 ✅        | main への push では CI を流さない      |
| 20  | Mac のゲーム ✅     | Mac でも Steam・Epic のバージョン      |
| 21  | ツールの定義 ✅     | 組み込みのツールを1ファイルの表にする  |
| 22  | リリースノート ✅   | 冒頭の案内を表と README へのリンクに   |
| 23  | 作業フォルダ起点 ✅ | open・Office の相対パスを workDir 起点 |
| 24  | ローカル設定 ✅     | ヘルプから config.local.yaml を作る    |
| 25  | 多言語対応 ✅       | 画面とヘルプを ja / en で切り替え      |
| 26  | 設定の言語の表 ✅   | label などを { ja, en } でも書ける     |
| 27  | 記録の archive ✅   | いまの正と当時の記録を分ける           |
| 28  | ツールを増やす 🚧   | ruby・go・rust・php と確認の自動化     |

## 次に扱う候補

**まだフェーズにしていない課題。** 次のフェーズを決めるときにここから選ぶ。
フェーズにしたら（`/phase-new`）、ここから消す。経緯は括弧内の PLAN.md を見る。

- 設定ファイルの JSON Schema を作り、エディタで補完と誤りの指摘を出す（Phase 11 の C のあとが作りやすい）（→ phase11）
- eslint 10 に上げる。eslint-plugin-react が対応してから（Dependabot の PR を 2026-11 に閉じた）（→ phase12）
- TypeScript 7 に上げる。lint が通らない（typescript-eslint の対応待ちと思われる）（→ phase12）
- Electron 46（安定版は 2027-01 予定、Node 26 入り）に上げ、`@types/node` も 26 にする（2026-11）
- Dependabot #1（minimatch の DoS、開発用の依存のみ）の残り。electron-builder が minimatch 11 に上げたら更新で消す（27 alpha でも ^10、2026-11）
- 署名を入れる。Win は SignPath Foundation（無償・審査あり）、mac は Apple Developer Program。使う人が出てから（2026-11 に見送り）（→ phase8）
- Steam の入っていない Windows で、Info の steam が「pattern が一致しません」ではなく「未インストール」と出るか確かめる（→ phase21）
