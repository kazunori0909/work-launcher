import { Code } from '../../parts'

/** ヘルプの章「要素の無効化」 */
export function Disable(): React.JSX.Element {
  return (
    <>
      <p>
        ボタンや select などを、押せない状態にできます。いまは JS の関数（function・イベント・
        <code>change</code>）の中からだけ変えられます。YAML
        だけでは書けません。関数の置き場所と呼び方は「ボタンを追加」と「イベント」の章を見てください。
      </p>
      <p>
        <code>ctx.disable</code> で押せなくし、<code>ctx.enable</code> で戻します。項目は ID
        で指定します。ボタンは <code>id</code> を書いた項目、select、radio、checkbox はその ID
        です。
      </p>
      <Code lang="yaml">{`- radio: mode
  options: [debug, release]
  change: onModeChange
- group: デバッグ用
  id: debug-tools
  items:
    - select: log-level
      options: [low, middle, high]
    - sh: ./debug.sh \${select:log-level}`}</Code>
      <Code lang="javascript">{`module.exports = {
  // release にすると、デバッグ用のグループを中の項目ごと押せなくする
  async onModeChange(ctx) {
    if (ctx.changed.value === 'release') await ctx.disable('debug-tools')
    else await ctx.enable('debug-tools')
  }
}`}</Code>
      <p>
        ID は <code>[&apos;a&apos;, &apos;b&apos;]</code> のように並べても渡せます。
        <code>group</code> や <code>buttons</code> の ID
        を渡すと、中の項目もまとめて変わります。同じ ID の項目がいくつもあれば、全部が変わります。
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
        押せない状態は、設定ファイルを読み直しても変わりません。案件を開き直すと、全部押せる状態に戻ります。開いたときから押せなくしておくときは{' '}
        <code>beforeOpen</code> か <code>afterOpen</code> で呼びます。
      </p>
      <p>
        押せなくするのは画面の操作だけです。関数から <code>ctx.sh</code>{' '}
        などで呼ぶ動作は止めません。無い ID や、見出し・md のように押せない項目の ID
        を渡すと、例外になります。
      </p>
    </>
  )
}
