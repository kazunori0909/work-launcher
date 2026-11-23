import { Code } from '../../parts'

/** ヘルプの章「値を変更する」 */
export function SetValues(): React.JSX.Element {
  return (
    <>
      <p>
        select、radio、checkbox の値を変えたり、初期値に戻したりできます。いまは JS
        の関数（function・イベント・<code>change</code>
        ）の中からだけ変えられます。YAML
        だけでは書けません。関数の置き場所と呼び方は「ボタンを追加」と「イベント」の章を見てください。
      </p>

      <h3>値を変える</h3>
      <p>
        <code>ctx.set</code> に ID と値を渡します。select と radio は選択肢の値を書きます。checkbox
        は <code>on</code>・<code>off</code> の値のほか、<code>true</code> / <code>false</code>{' '}
        でも書けます。
      </p>
      <Code lang="javascript">{`module.exports = {
  // 接続先を本番にしたら、モードを release にして、試しに実行をオンにする
  async onTargetChange(ctx) {
    if (ctx.changed.value === 'prod') {
      await ctx.set('mode', 'release')
      await ctx.set('dry', true)
    }
  }
}`}</Code>

      <h3>初期値に戻す</h3>
      <p>
        <code>ctx.reset</code> に ID を渡すと、初期値に戻します。初期値は <code>default</code>{' '}
        です。書いていなければ最初の選択肢で、checkbox はオフです。<code>group</code> や{' '}
        <code>buttons</code> の ID を渡すと、中の select、radio、checkbox
        をまとめて戻します。何も渡さなければ全部を戻します。
      </p>
      <Code lang="yaml">{`- group: デバッグ用
  id: debug-tools
  items:
    - select: log-level
      options: [low, middle, high]
      default: middle
    - checkbox: log-file
    - function: resetDebug
      label: ''
      icon: rotate-ccw
      tooltip: リセット`}</Code>
      <Code lang="javascript">{`async resetDebug(ctx) {
  await ctx.reset('debug-tools')   // log-level は middle、log-file はオフに戻る
}`}</Code>

      <h3>変えたあとの値</h3>
      <p>
        変えた値は、画面で選んだときと同じく <code>remember</code> なら記憶します。
        <code>await</code> したあとは、同じ関数の <code>ctx.select</code>{' '}
        にも入ります。そのあとに呼ぶ <code>ctx.sh</code> などの <code>{'${select:ID}'}</code>{' '}
        も、新しい値になります。
      </p>
      <p>
        <code>ctx.set</code>・<code>ctx.reset</code> では、変えた項目の <code>change</code>{' '}
        の関数を呼びません。項目どうしで書き換え合って、止まらなくなるのを避けるためです。続けて処理したいときは、同じ関数の中に書きます。
      </p>
      <p>無い ID や、選択肢に無い値を渡すと、例外になります。</p>
    </>
  )
}
