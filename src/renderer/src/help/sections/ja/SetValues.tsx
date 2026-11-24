import { Code, SampleView } from '../../parts'
import { EXAMPLES } from '../../examples'
import type { SectionProps } from '../../parts'

/** ヘルプの章「値を変更する」 */
export function SetValues({ platform }: SectionProps): React.JSX.Element {
  return (
    <>
      <p>
        select、radio、checkbox の値を、初期値に戻したり変えたりできます。初期値に戻すだけなら、YAML
        に <code>reset</code> のボタンを置くだけで済みます。別の値にするときは、JS
        の関数から変えます。
      </p>

      <h3>YAML で初期値に戻す（reset）</h3>
      <p>
        <code>reset</code> に戻す項目の ID
        を書くと、押したときに初期値に戻すボタンになります。初期値は <code>default</code>{' '}
        です。書いていなければ最初の選択肢で、checkbox
        はオフです。見本の値を変えてから押して試せます。
      </p>
      <SampleView example={EXAMPLES.reset} platform={platform} />
      <ul>
        <li>
          <code>group</code> や <code>buttons</code> の ID を書くと、中の select、radio、checkbox
          をまとめて戻します
        </li>
        <li>
          ID は <code>[log-level, log-file]</code> のように並べても書けます
        </li>
        <li>
          <code>label</code>、<code>icon</code>、<code>tooltip</code>、<code>confirm</code>{' '}
          はほかのボタンと同じく書けます。書かなければ「リセット」と出ます
        </li>
      </ul>

      <h3>関数から値を変える（ctx.set）</h3>
      <p>
        JS の関数（function・イベント・<code>change</code>
        ）からは、別の値にもできます。関数の置き場所と呼び方は「ボタンを追加」と「イベント」の章を見てください。
      </p>
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

      <h3>関数から初期値に戻す（ctx.reset）</h3>
      <p>
        <code>ctx.reset</code> に ID を渡すと、<code>reset</code>{' '}
        のボタンと同じく初期値に戻します。何も渡さなければ全部を戻します。
      </p>
      <Code lang="javascript">{`async onTargetChange(ctx) {
  // 接続先を変えたら、デバッグ用の値は初期値に戻す
  await ctx.reset('debug-tools')
}`}</Code>

      <h3>変えたあとの値</h3>
      <p>
        変えた値は、画面で選んだときと同じく <code>remember</code> なら記憶します。
        <code>await</code> したあとは、同じ関数の <code>ctx.select</code>{' '}
        にも入ります。そのあとに呼ぶ <code>ctx.sh</code> などの <code>{'${select:ID}'}</code>{' '}
        も、新しい値になります。
      </p>
      <p>
        <code>reset</code> のボタン、<code>ctx.set</code>、<code>ctx.reset</code> では、変えた項目の{' '}
        <code>change</code>{' '}
        の関数を呼びません。項目どうしで書き換え合って、止まらなくなるのを避けるためです。続けて処理したいときは、同じ関数の中に書きます。
      </p>
      <p>無い ID や、選択肢に無い値を渡すと、例外になります。</p>
    </>
  )
}
