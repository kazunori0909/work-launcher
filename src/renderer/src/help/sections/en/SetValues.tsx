import { Code } from '../../parts'

/** ヘルプの章「値を変更する」（英語） */
export function SetValues(): React.JSX.Element {
  return (
    <>
      <p>
        You can change the value of a select, radio or checkbox, or bring it back to its initial
        value. For now, this can only be done from a JS function (function, events or{' '}
        <code>change</code>). It cannot be written in YAML alone. Where to put functions and how to
        call them is in &quot;Adding buttons&quot; and &quot;Events&quot;.
      </p>

      <h3>Changing a value</h3>
      <p>
        Pass an ID and a value to <code>ctx.set</code>. A select or radio takes an option value. A
        checkbox takes its <code>on</code> / <code>off</code> value, or <code>true</code> /{' '}
        <code>false</code>.
      </p>
      <Code lang="javascript">{`module.exports = {
  // When the target is prod, switch to release mode and turn on dry run
  async onTargetChange(ctx) {
    if (ctx.changed.value === 'prod') {
      await ctx.set('mode', 'release')
      await ctx.set('dry', true)
    }
  }
}`}</Code>

      <h3>Resetting to the initial value</h3>
      <p>
        Pass an ID to <code>ctx.reset</code> to bring it back to its initial value: the{' '}
        <code>default</code>, otherwise the first option; a checkbox is off. The ID of a{' '}
        <code>group</code> or <code>buttons</code> resets the selects, radios and checkboxes inside
        it. With no argument, everything is reset.
      </p>
      <Code lang="yaml">{`- group: Debug
  id: debug-tools
  items:
    - select: log-level
      options: [low, middle, high]
      default: middle
    - checkbox: log-file
    - function: resetDebug
      label: ''
      icon: rotate-ccw
      tooltip: Reset`}</Code>
      <Code lang="javascript">{`async resetDebug(ctx) {
  await ctx.reset('debug-tools')   // log-level goes back to middle, log-file to off
}`}</Code>

      <h3>The value after the change</h3>
      <p>
        A changed value is remembered with <code>remember</code>, just like a value chosen in the
        window. After you <code>await</code> it, it is also in <code>ctx.select</code> of the same
        function, and <code>{'${select:ID}'}</code> in a later <code>ctx.sh</code> and the like uses
        the new value.
      </p>
      <p>
        <code>ctx.set</code> and <code>ctx.reset</code> do not call the <code>change</code> function
        of the changed item. This keeps items that rewrite each other from looping forever. To do
        more, write it in the same function.
      </p>
      <p>An unknown ID, or a value that is not an option, throws an exception.</p>
    </>
  )
}
