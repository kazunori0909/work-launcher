import { Code, Section, Table } from '../parts'

/** ヘルプの章「イベント」 */
export function Events(): React.JSX.Element {
  return (
    <Section id="events" title="イベント">
      <p>
        案件を開く・閉じるときと、選択肢を変えたときに、<code>launcher/scripts/</code> の JS
        の関数を呼べます。関数の書き方と <code>ctx</code> の中身は function
        と同じです（「ボタンを追加」の章）。
      </p>

      <h3>開く・閉じる</h3>
      <p>決まった名前の関数を書いておくと、アプリが呼びます。無ければ呼びません。</p>
      <Table
        head={['関数', '呼ぶとき']}
        rows={[
          ['beforeOpen', '案件を開くとき。画面を出す前（終わるまで画面を出さない）'],
          ['afterOpen', '案件を開くとき。画面を出したあと'],
          ['beforeClose', '閉じるとき（ウィンドウを閉じる・アプリを終了する）。終わるまで閉じない']
        ]}
      />
      <Code>{`// launcher/scripts/events.js（要るものだけ書く）
module.exports = {
  async beforeOpen(ctx) {
    ctx.log(\`接続先: \${ctx.select.target}\`)
  },
  async afterOpen(ctx) {},
  async beforeClose(ctx) {
    // await すると、終わるまで閉じずに待つ
  }
}`}</Code>
      <ul>
        <li>
          <code>scripts</code> に JS がある案件では、開いた直後に JS を実行してよいか確認が出ます。
          許可しなければイベントは呼びません。
        </li>
        <li>
          <code>ctx.select</code> はそのときの値です（開くときは記憶した値か既定値）。
        </li>
        <li>
          <code>beforeClose</code>{' '}
          が長くかかると「待たずに閉じる」が出ます。押すと関数を止めて閉じます。
        </li>
        <li>設定ファイルを保存して読み直したときは、開くイベントを呼び直しません。</li>
        <li>
          関数は呼ぶたびに JS
          を読み直すため、関数の間で変数の値は持ち越せません。要るときはファイルに書きます。
        </li>
      </ul>

      <h3>選択肢を変えたとき（change）</h3>
      <p>
        select・radio・checkbox に <code>change: 関数名</code>{' '}
        と書くと、画面で値を変えたときに呼びます。
      </p>
      <Code>{`- select: target
  options: [dev, prod]
  change: onTargetChange`}</Code>
      <Code>{`module.exports = {
  onTargetChange(ctx) {
    const { id, value, previous } = ctx.changed
    ctx.log(\`\${id}: \${previous} → \${value}\`)
  }
}`}</Code>
      <ul>
        <li>
          <code>ctx.changed</code> は変えた項目の ID・変えたあとの値・前の値、
          <code>ctx.select</code> は変えたあとの値です。
        </li>
        <li>
          開いたときの値の復元では呼びません（開いたときの処理は beforeOpen・afterOpen
          に書きます）。
        </li>
        <li>続けて変えたときは、前の関数が終わってから順に呼びます。</li>
      </ul>
    </Section>
  )
}
