import { Callout, Code, SampleView } from '../../parts'
import { EXAMPLES } from '../../examples'
import type { SectionProps } from '../../parts'

/** ヘルプの章「要素の無効化」 */
export function Disable({ platform }: SectionProps): React.JSX.Element {
  return (
    <>
      <p>
        ボタンや select などを、押せない状態にできます。select などの値で決まるなら、YAML
        に条件を書くだけで済みます。それ以外のときは、JS の関数から変えます。
      </p>

      <h3>YAML で条件を書く（enabledWhen / disabledWhen）</h3>
      <p>
        <code>enabledWhen</code> は、条件に合うときだけ押せます。<code>disabledWhen</code>{' '}
        は、条件に合うと押せません。条件は「select の ID: 値」で書きます。select、radio、checkbox
        の値が変わると、すぐに切り替わります。見本の値を変えて試せます。
      </p>
      <SampleView example={EXAMPLES.when} platform={platform} />
      <ul>
        <li>
          値を <code>[dev, stg]</code> のように並べると、どれかに合えば条件に合います
        </li>
        <li>ID を2つ以上書くと、全部に合うときだけ条件に合います</li>
        <li>
          checkbox は <code>on</code>・<code>off</code> の値のほか、<code>true</code> /{' '}
          <code>false</code> でも書けます
        </li>
        <li>
          <code>group</code> と <code>buttons</code> に書くと、中の項目もまとめて押せなくなります
        </li>
        <li>1つの項目には、どちらか一方だけを書けます。式は書けません</li>
      </ul>
      <p>
        書けるのはボタン、<code>group</code>、<code>buttons</code>、select、radio、checkbox
        です。無い ID や選択肢に無い値を書くと、その項目がエラーになります。
      </p>

      <h3>関数から変える（ctx.disable / ctx.enable）</h3>
      <p>
        条件が値だけで決まらないときは、JS の関数（function・イベント・<code>change</code>
        ）から変えます。関数の置き場所と呼び方は「ボタンを追加」と「イベント」の章を見てください。
      </p>
      <p>
        <code>ctx.disable</code> で押せなくし、<code>ctx.enable</code> で戻します。項目は ID
        で指定します。ボタンは <code>id</code> を書いた項目、select、radio、checkbox はその ID
        です。
      </p>
      <Code lang="yaml">{`- group: デバッグ用
  id: debug-tools
  items:
    - select: log-level
      options: [low, middle, high]
    - sh: ./debug.sh \${select:log-level}`}</Code>
      <Code lang="javascript">{`module.exports = {
  // デバッグ用の道具が入っていなければ、グループを中の項目ごと押せなくする
  async afterOpen(ctx) {
    const found = await ctx.sh('command -v debug-tool', { console: false })
    if (found.code !== 0) await ctx.disable('debug-tools')
  }
}`}</Code>
      <p>
        ID は <code>[&apos;a&apos;, &apos;b&apos;]</code> のように並べても渡せます。
        <code>group</code> や <code>buttons</code> の ID
        を渡すと、中の項目もまとめて変わります。同じ ID の項目がいくつもあれば、全部が変わります。
      </p>
      <p>
        YAML の条件と両方を使うと、どちらか一方で押せなくなれば押せません。
        <code>ctx.enable</code> で戻しても、YAML の条件に合わなければ押せないままです。
      </p>

      <h3>処理の間だけ全部を止める</h3>
      <p>
        何も渡さない <code>ctx.disable()</code> と <code>ctx.enable()</code>{' '}
        は、全部の項目を切り替えます。ID を渡して押せなくした項目は、<code>ctx.enable()</code>{' '}
        のあとも押せないままです。処理の間だけ全部を止めて、終わったら元の状態に戻せます。
      </p>
      <Code lang="javascript">{`async longTask(ctx) {
  await ctx.disable()
  try {
    await ctx.sh('./build.sh')
  } finally {
    await ctx.enable()
  }
}`}</Code>

      <h3>押せない状態が続く間</h3>
      <p>
        関数で押せなくした状態は、設定ファイルを読み直しても変わりません。案件を開き直すと、全部押せる状態に戻ります。開いたときから押せなくしておくときは{' '}
        <code>beforeOpen</code> か <code>afterOpen</code> で呼びます。
      </p>
      <Callout kind="warning">
        押せなくするのは画面の操作だけです。関数から <code>ctx.sh</code>{' '}
        などで呼ぶ動作は止めません。
      </Callout>
      <p>無い ID や、見出し・md のように押せない項目の ID を渡すと、例外になります。</p>
    </>
  )
}
