import { Code, Section } from '../parts'

/** ヘルプの章「はじめに」 */
export function Start(): React.JSX.Element {
  return (
    <Section id="start" title="はじめに">
      <p>
        <code>work.launcher</code> と <code>launcher/config.yaml</code>{' '}
        を置いたフォルダが、ランチャーのフォルダ（<code>{'${launcherDir}'}</code>
        ）になります。<code>work.launcher</code> の中身は空でかまいません。ページとボタンは{' '}
        <code>config.yaml</code> に YAML で書き、保存すると自動で画面に反映されます。
      </p>
      <p>開き方は2通りです。</p>
      <ul>
        <li>
          Windows のポータブル版 <code>WorkLauncher.exe</code>{' '}
          を同じフォルダに置き、ダブルクリックする（リポジトリに一緒にコミットできます。Mac
          にポータブル版はありません）
        </li>
        <li>
          インストールしたアプリで開く: <code>work.launcher</code>{' '}
          をダブルクリックする・アプリのアイコンにドロップする・メニューの「案件を開く…」（
          <code>⌘O</code> / <code>Ctrl+O</code>）で選ぶ。案件ごとにウィンドウが開き、
          最近開いた案件はアプリを単独で起動したときの画面から開けます
        </li>
      </ul>
      <Code>{`<ランチャーのフォルダ>/
  WorkLauncher.exe       ポータブル版（Windows。同梱するとき）
  work.launcher          目印（中身は空でよい）
  launcher/
config.yaml            共通の設定（リポジトリにコミットする）
config.local.yaml      個人用の設定（.gitignore に入れる）
pages/*.yaml           ページを別ファイルに分けるとき
scripts/*.js           function から呼ぶ関数
console.yaml           コンソールの色分け
style.css              見た目の変更`}</Code>
      <p>いちばん小さい設定は次のとおりです。</p>
      <Code>{`version: 1
title: 案件名
pages:
  - id: top
title: メイン
items:
  - bat: build.bat
    label: ビルド`}</Code>
    </Section>
  )
}
