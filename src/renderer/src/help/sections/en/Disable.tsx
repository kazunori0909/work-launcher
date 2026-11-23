import { Code } from '../../parts'

/** ヘルプの章「要素の無効化」（英語） */
export function Disable(): React.JSX.Element {
  return (
    <>
      <p>
        You can make buttons, selects and other items unable to be pressed. For now, this can only
        be done from a JS function (function, events or <code>change</code>). It cannot be written
        in YAML alone. Where to put functions and how to call them is in &quot;Adding buttons&quot;
        and &quot;Events&quot;.
      </p>
      <p>
        <code>ctx.disable</code> makes items unable to be pressed, and <code>ctx.enable</code>{' '}
        brings them back. Items are given by ID: for a button, the <code>id</code> you wrote on it;
        for a select, radio or checkbox, its ID.
      </p>
      <Code lang="yaml">{`- radio: mode
  options: [debug, release]
  change: onModeChange
- group: Debug
  id: debug-tools
  items:
    - select: log-level
      options: [low, middle, high]
    - sh: ./debug.sh \${select:log-level}`}</Code>
      <Code lang="javascript">{`module.exports = {
  // In release mode, disable the debug group and everything in it
  async onModeChange(ctx) {
    if (ctx.changed.value === 'release') await ctx.disable('debug-tools')
    else await ctx.enable('debug-tools')
  }
}`}</Code>
      <p>
        You can also pass several IDs, like <code>[&apos;a&apos;, &apos;b&apos;]</code>. The ID of a{' '}
        <code>group</code> or <code>buttons</code> changes the items inside it as well. When several
        items share an ID, all of them change.
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
        Items stay disabled when the config file is reloaded. Opening the project again makes all
        items pressable. To start with items disabled, call it in <code>beforeOpen</code> or{' '}
        <code>afterOpen</code>.
      </p>
      <p>
        Only the window is affected: actions called from a function, such as <code>ctx.sh</code>,
        still run. An unknown ID, or the ID of an item that cannot be pressed (such as a heading or
        md), throws an exception.
      </p>
    </>
  )
}
