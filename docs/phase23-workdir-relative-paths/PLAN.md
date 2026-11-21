# Phase 23: open・Office の相対パスを作業フォルダ起点にする

## 課題

- ランチャーを案件の外（例: `root/work-launcher`）に置き、案件（`root/project-hoge`）のファイルを使いたい
- いまは設定に書く相対パスがすべて `${launcherDir}` 起点で、実行系の本文だけが `${workDir}` 起点。
  `cwd: ../project-hoge` を書いても、open・excel などは毎回 `${workDir}/…` と書く必要がある

## 方針

- 案件で管理するファイルを開く項目だけ `${workDir}` 起点にする

  | 起点             | 対象                                                          |
  | ---------------- | ------------------------------------------------------------- |
  | `${workDir}`     | open・excel・word・powerpoint（関数の `ctx.open` などを含む） |
  | `${launcherDir}` | md（ファイル・リンク・画像）・include・scripts・style・`cwd`  |

- どの `cwd` を見るかは、いまの `${workDir}` と同じ（ページ → 最上位）
- `cwd` を書かない案件は workDir = launcherDir なので、動きは変わらない
- md の中のファイルへのリンクは open と同じ処理で開いていたので、launcherDir 起点のまま開くよう分ける

## 決定事項ログ

### 2026-11-21: open・Office の相対パスを workDir 起点にする（ユーザー判断）

- 互換は崩れる（`cwd` を書き、open・Office に相対パスを書いている設定は指す先が変わる）。0.x なので受け入れる
- md は workDir に揃えない。md はページの補足を外のファイルに出したもので、ページ（YAML）と同じく
  ランチャーの中に置く。excel・word などは案件で管理するファイルを指すので workDir にする
- 採らなかった案: md も workDir に揃える（ランチャー内の md を全部 `${launcherDir}/…` と書くことになり、
  リンク・画像の配信範囲も広げる必要がある）／何も変えずに説明だけ足す
- 組み込みのヘルプが壊れないようにする（説明・見本を新しい起点に合わせる）

### 2026-11-21: ランチャーの中のファイルは `${launcherDir}` を明示して書く（ユーザー判断）

- ヘルプの見本・config.md・examples/sample で、open などでランチャーの中のファイルを指すところは
  `${launcherDir}/launcher/…` と書く。`cwd` を書いた案件に写しても、指す先が変わらないようにするため
