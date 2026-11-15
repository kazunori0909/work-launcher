import { Code, Section, Table } from '../parts'

/** ヘルプの章「イベント」 */
export function Events(): React.JSX.Element {
  return (
    <Section id="events" title="イベント">
      <p>
        案件を開いたときや閉じるとき、選択肢を変えたときに、<code>launcher/scripts/</code> の JS
        の関数を呼べます。開いたら接続先をコンソールに出す、閉じる前に後片付けをする、といった使い方です。関数の書き方と{' '}
        <code>ctx</code> の中身は function と同じです（「ボタンを追加」の章）。
      </p>

      <h3>開く・閉じる</h3>
      <p>
        決まった名前の関数を書いておくと、アプリが呼びます。要らないものは書かなくてかまいません。
      </p>
      <Table
        head={['関数', '呼ぶとき']}
        rows={[
          ['beforeOpen', '案件を開くとき。画面を出す前（終わるまで画面を出さない）'],
          ['afterOpen', '案件を開くとき。画面を出したあと'],
          ['beforeClose', '閉じるとき（ウィンドウを閉じる・アプリを終了する）。終わるまで閉じない']
        ]}
      />
      <Code lang="javascript">{`// launcher/scripts/events.js（要るものだけ書く）
module.exports = {
  async beforeOpen(ctx) {
    ctx.log(\`接続先: \${ctx.select.target}\`)
  },
  async afterOpen(ctx) {},
  async beforeClose(ctx) {
    // await すると、終わるまで閉じずに待つ
  }
}`}</Code>
      <p>
        <code>scripts</code> に JS がある案件を開くと、最初に JS
        を実行してよいかの確認が出ます。許可しなかったときは、イベントも呼びません。
      </p>
      <p>
        <code>ctx.select</code> にはそのときの値が入ります。開くときなら、記憶した値か既定値です。
        <code>beforeClose</code>{' '}
        に時間がかかると「待たずに閉じる」が出て、押せば関数を止めて閉じます。
      </p>
      <p>
        設定ファイルを保存して読み直したときは、開くイベントをもう一度は呼びません。JS
        は呼ぶたびに読み直すので、関数の間で変数の値を持ち越すこともできません。残したい値はファイルに書いてください。
      </p>

      <h3>選択肢を変えたとき（change）</h3>
      <p>
        select、radio、checkbox に <code>change: 関数名</code>{' '}
        を書くと、画面で値を変えたときにその関数を呼びます。
      </p>
      <Code lang="yaml">{`- select: target
  options: [dev, prod]
  change: onTargetChange`}</Code>
      <Code lang="javascript">{`module.exports = {
  onTargetChange(ctx) {
    const { id, value, previous } = ctx.changed
    ctx.log(\`\${id}: \${previous} → \${value}\`)
  }
}`}</Code>
      <p>
        <code>ctx.changed</code> には、変えた項目の ID と、変えたあとの値、前の値が入ります。
        <code>ctx.select</code>{' '}
        は変えたあとの値です。値を続けて変えたときは、前の呼び出しが終わってから順番に呼びます。
      </p>
      <p>
        案件を開いて記憶した値を戻すときは呼びません。開いたときの処理は <code>beforeOpen</code> か{' '}
        <code>afterOpen</code> に書きます。
      </p>
    </Section>
  )
}
