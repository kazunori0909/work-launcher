import { BUILTIN_TOOLS, toolHelp } from '../../../../../core/builtinTools'
import { Code, Table } from '../../parts'

/** ヘルプの章「Info ページ」（英語） */
export function Info(): React.JSX.Element {
  return (
    <>
      <p>
        Shows information about this PC in one place: OS, CPU, memory, GPU, drives, IP addresses and
        more. For questions or bug reports, press &quot;Copy as text&quot; and paste it as is. To
        copy one box, press the button at its top right.
      </p>
      <p>
        Environment variables, tool versions and registry values are shown only if listed in the
        settings.
      </p>
      <Code lang="yaml">{`info:
  env: [JAVA_HOME, PATH]       # environment variables to show
  tools:
    - git                      # built-in tools: just the name (table below)
    - node
    - name: Maven              # others: write the command
      command: mvn -v
      pattern: "Apache Maven ([\\d.]+)"   # shows the first ( ) (or line 1)
  registry:                    # shown only on Windows
    - HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem\\LongPathsEnabled
    - name: JDK                # display name (the value name if omitted)
      path: HKLM\\SOFTWARE\\JavaSoft\\JDK\\CurrentVersion
  drives: false                # to hide drives`}</Code>
      <h3>Built-in tools</h3>
      <p>
        These tools can be shown by writing just the name in <code>tools</code>, without saying how
        to get the version. All of them work on Windows and Mac. For anything else, write{' '}
        <code>command</code> and <code>pattern</code> like Maven above.
      </p>
      <Table
        head={['Name', 'Shows']}
        rows={BUILTIN_TOOLS.map((t) => [t.name, toolHelp(t, 'en')])}
      />
      <p>
        Tool commands run in the launcher folder. If a tool is not found, it shows &quot;Not
        installed&quot;; if the output does not match <code>pattern</code>, it shows &quot;pattern
        did not match&quot;. Steam shows &quot;Not installed&quot; if it has never been started.
      </p>
      <p>
        If a tool changes and the built-in way stops working, write <code>command</code> or{' '}
        <code>pattern</code> under the same name to override it. Writing <code>command</code>{' '}
        replaces it together with <code>pattern</code> and uses that command on every OS. Writing
        only <code>pattern</code> changes just how the version is taken from the built-in
        command&apos;s output.
      </p>
      <Code lang="yaml">{`info:
  tools:
    - name: steam              # still shown as Steam
      pattern: '"version"\\s+"(\\d+)"'`}</Code>
      <h3>Changing tools on your PC only</h3>
      <p>
        Tools written in <code>tools</code> of <code>config.local.yaml</code> are added after the
        shared ones. To hide a tool from the shared settings, write <code>hidden: true</code> under
        the same name.
      </p>
      <Code lang="yaml">{`info:
  tools:
    - { name: node, hidden: true }   # hide node from the shared settings
    - name: Maven                    # add a tool only you use
      command: mvn -v`}</Code>
      <p>
        Do not quote registry paths. Inside <code>{'"…"'}</code>, <code>\</code> is read as an
        escape character. Ending a path with <code>\</code> reads the key&apos;s default value.
      </p>
    </>
  )
}
