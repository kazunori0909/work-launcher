import { Callout, Code } from '../../parts'

/** ヘルプの章「はじめに」 */
export function Start(): React.JSX.Element {
  return (
    <>
      <p>
        WorkLauncher は、案件でよく使うコマンドや資料をボタンにまとめておくアプリです。ボタンは{' '}
        <code>launcher/config.yaml</code> に YAML で書きます。保存すると、すぐ画面に反映されます。
      </p>
      <p>
        使い始めるには、案件のフォルダに空のファイル <code>work.launcher</code> と{' '}
        <code>launcher/config.yaml</code>{' '}
        を置きます。このフォルダを「ランチャーのフォルダ」と呼びます。設定の中では{' '}
        <code>{'${launcherDir}'}</code> と書いて参照できます。
      </p>

      <h3>開き方</h3>
      <p>
        Windows なら、ポータブル版の <code>WorkLauncher.exe</code>{' '}
        を同じフォルダに置いてダブルクリックするのが手軽です。exe
        ごとリポジトリにコミットしておけば、チームの誰でも同じ手順で開けます。
      </p>
      <Callout kind="note">
        Mac にはポータブル版がありません。アプリをインストールして使います。
      </Callout>
      <p>
        アプリをインストールしているなら、<code>work.launcher</code>{' '}
        をダブルクリックするか、アプリのアイコンにドロップします。メニューの「案件を開く…」（
        <code>⌘O</code> / <code>Ctrl+O</code>
        ）からも選べます。案件ごとに別のウィンドウが開きます。最近開いた案件は、アプリだけを起動したときの画面に並びます。
      </p>

      <h3>フォルダの中身</h3>
      <p>
        必要なのは <code>work.launcher</code> と <code>config.yaml</code>{' '}
        の2つだけです。ほかのファイルは、使いたくなったときに足せば十分です。
      </p>
      <Code>{`<ランチャーのフォルダ>/
  WorkLauncher.exe       ポータブル版（Windows で同梱するとき）
  work.launcher          目印（中身は空でよい）
  launcher/
    config.yaml          共通の設定（リポジトリにコミットする）
    config.local.yaml    自分だけの設定（.gitignore に入れる）
    pages/*.yaml         ページを別ファイルに分けるとき
    scripts/*.js         function から呼ぶ関数
    console.yaml         コンソールの色分け
    style.css            見た目の変更`}</Code>
      <p>いちばん小さい設定はこれです。ボタンが1つだけのページができます。</p>
      <Code lang="yaml">{`version: 1
title: 案件名
pages:
  - id: top
    title: メイン
    items:
      - bat: build.bat
        label: ビルド`}</Code>
    </>
  )
}
