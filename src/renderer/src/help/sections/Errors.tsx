import { Section } from '../parts'

/** ヘルプの章「エラーが出たとき」 */
export function Errors(): React.JSX.Element {
  return (
    <Section id="errors" title="エラーが出たとき">
      <ul>
        <li>YAML の書き間違いは、ページの代わりにエラー画面が出ます（ファイル名と行番号つき）。</li>
        <li>
          項目の書き間違い（種類キーが無い・2つあるなど）は、その位置に赤くエラーが出ます。ほかの項目は使えます。
        </li>
        <li>知らないキーやアイコン名は、画面上部の「設定の問題」に警告として出ます。</li>
        <li>実行の失敗や開けなかったときは、コンソールが開いて理由が出ます。</li>
      </ul>
    </Section>
  )
}
