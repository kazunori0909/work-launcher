# WorkLauncher 開発ドキュメント

このディレクトリには、開発フェーズごとの計画・作業記録を格納する。
構成は [AGENTS.md](../AGENTS.md)、開発ルールは [CLAUDE.md](../CLAUDE.md) を参照。

進行中のフェーズは `docs/phase<N>-<slug>/` に以下を持つ:

- `PLAN.md` — 設計上の選択とその理由
- `TASKS.md` — 作業チェックリスト
- `KNOWLEDGE.md`（任意）— 実機・OS・外部ツールで判明した挙動・制約
- `HANDOFF.md`（任意）— Mac と Windows の Claude どうしの依頼と回答（`/handoff`）。圧縮では統合しない

完了したフェーズは決定事項・確定仕様を `phases.md` へ、KNOWLEDGE.md（あれば）は
要約せず `knowledge.md` へ統合し、フォルダは削除する（元の記録は git 履歴に残る）。
どちらのファイルも最初の圧縮時に作る。

新規フェーズの追加は `/phase-new`、完了済みフェーズの圧縮は
`/phase-compress`（ユーザーが明示的に指示したときのみ）で行う。

## 開発フェーズ記録

**この表は Phase 番号の索引。** 決定事項は `phases.md` で `## Phase <N>:` を検索し、
**その節だけ**読む（全文は読まない）。

- **🚧** … 進行中。`docs/phase<N>-<slug>/` に PLAN.md・TASKS.md がある
- **📘** … `knowledge.md` にも節がある
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

## 次に扱う候補

**まだフェーズにしていない課題。** 次のフェーズを決めるときにここから選ぶ。
フェーズにしたら（`/phase-new`）、ここから消す。経緯は括弧内の PLAN.md を見る。

- 設定ファイルの JSON Schema を作り、エディタで補完と誤りの指摘を出す（Phase 11 の C のあとが作りやすい）（→ phase11）
- eslint 10 に上げる。eslint-plugin-react が対応してから（Dependabot の PR を 2026-11 に閉じた）（→ phase12）
- TypeScript 7 に上げる。lint が通らない（typescript-eslint の対応待ちと思われる）（→ phase12）
- 署名を入れる。Win は SignPath Foundation（無償・審査あり）、mac は Apple Developer Program。使う人が出てから（2026-11 に見送り）（→ phase8）
- 次のリリースノートで、open・Office の相対パスが workDir 起点に変わったこと（`cwd` を書いた設定は互換が崩れる）を知らせる（→ phase23）
- Steam の入っていない Windows で、Info の steam が「pattern が一致しません」ではなく「未インストール」と出るか確かめる（→ phase21）
