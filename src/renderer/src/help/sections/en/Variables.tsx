import { t } from '../../../../../core/i18n'
import { Table } from '../../parts'
import type { SectionProps } from '../../parts'

/** ヘルプの章「変数」（英語） */
export function Variables({ launcherDir, workDir }: SectionProps): React.JSX.Element {
  return (
    <>
      <p>
        Written in a path, command or URL, these are replaced with real values when you press the
        button.
      </p>
      <Table
        head={['Syntax', 'Meaning', 'Current value']}
        rows={[
          [
            '${launcherDir}',
            'The launcher folder (the folder with work.launcher)',
            launcherDir ?? t().help.notOpen
          ],
          [
            '${workDir}',
            'The working folder (cwd; the launcher folder unless you set it)',
            workDir ?? t().help.notOpen
          ],
          [
            '${env:NAME}',
            'Environment variable NAME (empty if missing, with a warning in the console)',
            'Set when pressed'
          ],
          [
            '${select:ID}',
            'The value chosen in a select, radio or checkbox (see "Other elements")',
            'Set when pressed'
          ],
          ['$${launcherDir}', 'Outputs the text ${launcherDir} without replacing it', '']
        ]}
      />
      <p>
        Any <code>{'${...}'}</code> not in this table is left as is, so you can write things like{' '}
        <code>{'${HOME}'}</code> in sh.
      </p>

      <p>
        How to change <code>{'${workDir}'}</code>, and what changes when you do, is in &quot;Editing
        the settings&quot;.
      </p>
    </>
  )
}
