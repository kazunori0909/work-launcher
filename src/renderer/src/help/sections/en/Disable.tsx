import { Callout, Code, SampleView } from '../../parts'
import { EXAMPLES_EN } from '../../examples.en'
import type { SectionProps } from '../../parts'

/** ヘルプの章「要素の無効化」（英語） */
export function Disable({ platform }: SectionProps): React.JSX.Element {
  return (
    <>
      <p>
        You can make buttons, selects and other items unable to be pressed. When it depends on the
        value of a select or the like, a condition in YAML is enough. Otherwise, change it from a JS
        function.
      </p>

      <h3>Conditions in YAML (enabledWhen / disabledWhen)</h3>
      <p>
        With <code>enabledWhen</code>, the item can be pressed only when the condition matches. With{' '}
        <code>disabledWhen</code>, it cannot be pressed when the condition matches. Write the
        condition as &quot;select ID: value&quot;. It switches as soon as a select, radio or
        checkbox changes. Try changing the values in the sample.
      </p>
      <SampleView example={EXAMPLES_EN.when} platform={platform} />
      <ul>
        <li>
          List values, like <code>[dev, stg]</code>, to match any of them
        </li>
        <li>With two or more IDs, the condition matches only when all of them match</li>
        <li>
          A checkbox takes its <code>on</code> / <code>off</code> value, or <code>true</code> /{' '}
          <code>false</code>
        </li>
        <li>
          On a <code>group</code> or <code>buttons</code>, the items inside are disabled too
        </li>
        <li>An item takes only one of the two. Expressions cannot be written</li>
      </ul>
      <p>
        You can write them on buttons, <code>group</code>, <code>buttons</code>, select, radio and
        checkbox. An unknown ID, or a value that is not an option, turns the item into an error.
      </p>

      <h3>From a function (ctx.disable / ctx.enable)</h3>
      <p>
        When the condition is not just a value, change it from a JS function (function, events or{' '}
        <code>change</code>). Where to put functions and how to call them is in &quot;Adding
        buttons&quot; and &quot;Events&quot;.
      </p>
      <p>
        <code>ctx.disable</code> makes items unable to be pressed, and <code>ctx.enable</code>{' '}
        brings them back. Items are given by ID: for a button, the <code>id</code> you wrote on it;
        for a select, radio or checkbox, its ID.
      </p>
      <Code lang="yaml">{`- group: Debug
  id: debug-tools
  items:
    - select: log-level
      options: [low, middle, high]
    - sh: ./debug.sh \${select:log-level}`}</Code>
      <Code lang="javascript">{`module.exports = {
  // Without the debug tool, disable the debug group and everything in it
  async afterOpen(ctx) {
    const found = await ctx.sh('command -v debug-tool', { console: false })
    if (found.code !== 0) await ctx.disable('debug-tools')
  }
}`}</Code>
      <p>
        You can also pass several IDs, like <code>[&apos;a&apos;, &apos;b&apos;]</code>. The ID of a{' '}
        <code>group</code> or <code>buttons</code> changes the items inside it as well. When several
        items share an ID, all of them change.
      </p>
      <p>
        With both a YAML condition and a function, the item is disabled if either one disables it.
        After <code>ctx.enable</code>, it stays disabled while the YAML condition says so.
      </p>

      <h3>Stopping everything during a task</h3>
      <p>
        With no argument, <code>ctx.disable()</code> and <code>ctx.enable()</code> switch all items.
        Items disabled by ID stay disabled after <code>ctx.enable()</code>, so you can stop
        everything during a task and return to the previous state afterwards.
      </p>
      <Code lang="javascript">{`async longTask(ctx) {
  await ctx.disable()
  try {
    await ctx.sh('./build.sh')
  } finally {
    await ctx.enable()
  }
}`}</Code>

      <h3>How long items stay disabled</h3>
      <p>
        Items disabled by a function stay disabled when the config file is reloaded. Opening the
        project again makes all items pressable. To start with items disabled, call it in{' '}
        <code>beforeOpen</code> or <code>afterOpen</code>.
      </p>
      <Callout kind="warning">
        Only the window is affected: actions called from a function, such as <code>ctx.sh</code>,
        still run.
      </Callout>
      <p>
        An unknown ID, or the ID of an item that cannot be pressed (such as a heading or md), throws
        an exception.
      </p>
    </>
  )
}
