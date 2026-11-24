import { Code, SampleView } from '../../parts'
import { EXAMPLES_EN } from '../../examples.en'
import type { SectionProps } from '../../parts'

/** ヘルプの章「値を変更する」（英語） */
export function SetValues({ platform }: SectionProps): React.JSX.Element {
  return (
    <>
      <p>
        You can bring a select, radio or checkbox back to its initial value, or change its value. To
        reset only, a <code>reset</code> button in YAML is enough. To set another value, use a JS
        function.
      </p>

      <h3>Resetting in YAML (reset)</h3>
      <p>
        Write the ID of the items in <code>reset</code> to make a button that brings them back to
        their initial value: the <code>default</code>, otherwise the first option; a checkbox is
        off. Change the values in the sample, then press it.
      </p>
      <SampleView example={EXAMPLES_EN.reset} platform={platform} />
      <ul>
        <li>
          The ID of a <code>group</code> or <code>buttons</code> resets the selects, radios and
          checkboxes inside it
        </li>
        <li>
          You can also list IDs, like <code>[log-level, log-file]</code>
        </li>
        <li>
          <code>label</code>, <code>icon</code>, <code>tooltip</code> and <code>confirm</code> work
          as on other buttons. Without a label, it shows &quot;Reset&quot;
        </li>
      </ul>

      <h3>Setting a value from a function (ctx.set)</h3>
      <p>
        A JS function (function, events or <code>change</code>) can also set another value. Where to
        put functions and how to call them is in &quot;Adding buttons&quot; and &quot;Events&quot;.
      </p>
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

      <h3>Resetting from a function (ctx.reset)</h3>
      <p>
        Pass an ID to <code>ctx.reset</code> to reset it, just like a <code>reset</code> button.
        With no argument, everything is reset.
      </p>
      <Code lang="javascript">{`async onTargetChange(ctx) {
  // When the target changes, reset the debug values
  await ctx.reset('debug-tools')
}`}</Code>

      <h3>The value after the change</h3>
      <p>
        A changed value is remembered with <code>remember</code>, just like a value chosen in the
        window. After you <code>await</code> it, it is also in <code>ctx.select</code> of the same
        function, and <code>{'${select:ID}'}</code> in a later <code>ctx.sh</code> and the like uses
        the new value.
      </p>
      <p>
        A <code>reset</code> button, <code>ctx.set</code> and <code>ctx.reset</code> do not call the{' '}
        <code>change</code> function of the changed item. This keeps items that rewrite each other
        from looping forever. To do more, write it in the same function.
      </p>
      <p>An unknown ID, or a value that is not an option, throws an exception.</p>
    </>
  )
}
