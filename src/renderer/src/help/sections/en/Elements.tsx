import { CheatSheet, SampleView, Table } from '../../parts'
import { ELEMENT_CHEATS_EN, EXAMPLES_EN } from '../../examples.en'
import type { SectionProps } from '../../parts'

/** ヘルプの章「ボタン以外の要素」（英語） */
export function Elements({ platform }: SectionProps): React.JSX.Element {
  return (
    <>
      <p>
        These are controls for choosing values. Put the chosen value into another button&apos;s
        command or path by writing <code>{'${select:ID}'}</code>. In a function, read it with{' '}
        <code>ctx.select.ID</code>.
      </p>
      <h3>Cheat sheet</h3>
      <CheatSheet cheats={ELEMENT_CHEATS_EN} platform={platform} />

      <h3>Select (select)</h3>
      <p>
        Pick one from a drop-down. Besides commands, <code>{'${select:ID}'}</code> can be written in{' '}
        <code>env</code>, paths, URLs and <code>confirm</code> messages. In the example below, you
        choose the target and then press the deploy button.
      </p>
      <SampleView example={EXAMPLES_EN.select} platform={platform} />
      <Table
        head={['Key', 'Meaning']}
        rows={[
          ['select', 'ID of the select (letters, digits, - and _)'],
          ['label', 'Text shown to the left of the choices'],
          ['options', 'Choices: values, or { label, value }'],
          ['default', 'Default value (the first choice if omitted)'],
          ['remember', 'If true, remembers the choice for the next time (default: not remembered)']
        ]}
      />
      <p>
        Remembered values are stored per project inside the app on this PC. Project files are not
        changed, so there is no diff in the repository. A select with the same ID on another page
        shares the same value.
      </p>

      <h3>Radio buttons (radio)</h3>
      <p>
        Choices are shown in a row and you pick one. With few choices, this is easier to see at a
        glance than a drop-down. Just change <code>select</code> to <code>radio</code>; everything
        else, including how the value is used, is the same as select.
      </p>
      <SampleView example={EXAMPLES_EN.radio} platform={platform} />
      <Table
        head={['Key', 'Meaning']}
        rows={[
          ['radio', 'ID (letters, digits, - and _)'],
          ['label', 'Text shown to the left of the choices'],
          ['options', 'Choices: values, or { label, value }'],
          ['default', 'Default value (the first choice if omitted)'],
          ['remember', 'Same as select']
        ]}
      />

      <h3>Checkbox (checkbox)</h3>
      <p>
        Switches on and off. Write the value to put in for each state in <code>on</code> and{' '}
        <code>off</code>. In the example below, <code>--dry-run</code> is added only when it is
        checked.
      </p>
      <SampleView example={EXAMPLES_EN.checkbox} platform={platform} />
      <Table
        head={['Key', 'Meaning']}
        rows={[
          ['checkbox', 'ID (letters, digits, - and _)'],
          ['label', 'Text shown to the right of the box (the ID if omitted)'],
          ['on', 'Value when on (true if omitted)'],
          ['off', "Value when off (false if omitted). Write '' for empty"],
          ['default', 'If true, starts checked (unchecked if omitted)'],
          ['remember', 'Same as select']
        ]}
      />
      <p>
        IDs are shared by select, radio and checkbox. The same ID means the same value, even for
        different kinds.
      </p>
    </>
  )
}
