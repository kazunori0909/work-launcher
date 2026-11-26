import { Callout, Code, Table } from '../../parts'

/** ヘルプの章「イベント」（英語） */
export function Events(): React.JSX.Element {
  return (
    <>
      <p>
        JS functions in <code>launcher/scripts/</code> can be called when a project opens or closes,
        or when a choice changes: for example, showing the target in the console on open, or
        cleaning up before closing. Functions are written and <code>ctx</code> works the same as for
        function (see &quot;Adding buttons&quot;).
      </p>

      <h3>Opening and closing</h3>
      <p>
        Write functions with these names and the app calls them. Leave out the ones you do not need.
      </p>
      <Table
        head={['Function', 'Called when']}
        rows={[
          ['beforeOpen', 'Opening a project, before the window is shown (shown after it finishes)'],
          ['afterOpen', 'Opening a project, after the window is shown'],
          [
            'beforeClose',
            'Closing (closing the window or quitting the app). Does not close until it finishes'
          ]
        ]}
      />
      <Code lang="javascript">{`// launcher/scripts/events.js (write only what you need)
module.exports = {
  async beforeOpen(ctx) {
    ctx.log(\`Target: \${ctx.select.target}\`)
  },
  async afterOpen(ctx) {},
  async beforeClose(ctx) {
    // with await, closing waits until this finishes
  }
}`}</Code>
      <p>
        When you open a project with JS in <code>scripts</code>, you are first asked whether to
        allow running JS. If you do not allow it, events are not called either.
      </p>
      <p>
        <code>ctx.select</code> has the values at that moment; when opening, those are the
        remembered or default values. If <code>beforeClose</code> takes a while, &quot;Close without
        waiting&quot; appears; pressing it stops the function and closes.
      </p>
      <p>Saving the settings and reloading does not call the open events again.</p>
      <Callout kind="warning">
        JS is reloaded on every call, so variables do not carry over between functions. Write
        anything you want to keep to a file.
      </Callout>

      <h3>When a choice changes (change)</h3>
      <p>
        Write <code>change: functionName</code> on a select, radio or checkbox, and that function is
        called when the value is changed in the window.
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
        <code>ctx.changed</code> has the ID of the changed item, the new value and the previous
        value. <code>ctx.select</code> has the new values. When values change in quick succession,
        calls run one by one, each after the previous one finishes.
      </p>
      <p>
        It is not called when remembered values are restored on opening. Put work for opening in{' '}
        <code>beforeOpen</code> or <code>afterOpen</code>.
      </p>
    </>
  )
}
