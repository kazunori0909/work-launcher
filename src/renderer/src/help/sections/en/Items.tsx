import { CheatSheet, Code, SampleView, Table } from '../../parts'
import { EXAMPLES_EN, ITEM_CHEATS_EN } from '../../examples.en'
import type { SectionProps } from '../../parts'

/** ヘルプの章「ボタンを追加」（英語） */
export function Items({ platform }: SectionProps): React.JSX.Element {
  return (
    <>
      <h3>Cheat sheet</h3>
      <CheatSheet cheats={ITEM_CHEATS_EN} platform={platform} />

      <h3>Common attributes</h3>
      <p>
        The key you write decides the kind of item: <code>bat</code> makes a button that runs a
        command, <code>open</code> a button that opens a file. This key is called the &quot;type
        key&quot;. The attributes below can be written on any kind.
      </p>
      <Table
        head={['Attribute', 'Meaning']}
        rows={[
          [
            'label',
            'Button text. Defaults to the type key value (the first command line or file name)'
          ],
          ['icon', 'Icon name (see Layout and decoration). Defaults to one per kind'],
          ['tooltip', 'Text shown on mouse hover'],
          ['confirm', 'Confirmation message shown when pressed'],
          ['id', 'Marker for replacing the item from local settings']
        ]}
      />
      <p>
        Written as <code>{'{ ja: …, en: … }'}</code>, <code>label</code>, <code>tooltip</code> and{' '}
        <code>confirm</code> follow the language chosen at the top right. Plain strings are shown as
        is in every language.
      </p>
      <Code lang="yaml">{`- bat: deploy.bat
  label: { ja: デプロイ, en: Deploy }
  confirm: { ja: 本番に出しますか？, en: Deploy to production? }`}</Code>
      <p>
        Not only buttons: most text shown in the window, such as group headings, page tabs, headings
        and md text, can be written the same way. See &quot;Writing per language&quot; in
        &quot;Editing the settings&quot; for details.
      </p>

      <h3>Running commands (bat / sh / powershell / python)</h3>
      <p>
        Write the command as the value of the type key. Its output goes to the console. The shell
        used depends on the OS.
      </p>
      <Table
        head={['Key', 'Windows', 'Mac']}
        rows={[
          ['bat', 'cmd', 'Disabled'],
          ['sh', 'Git Bash', 'bash'],
          ['powershell', 'pwsh (or Windows PowerShell)', 'pwsh (install it)'],
          ['python', 'py (or python)', 'python3']
        ]}
      />
      <p>If the shell is not found, the console shows why.</p>
      <SampleView example={EXAMPLES_EN.exec} platform={platform} />
      <p>
        For more than one line, write <code>|</code> and indent the lines that follow.
      </p>
      <SampleView example={EXAMPLES_EN.execOptions} platform={platform} />
      <p>PowerShell and Python are written the same way.</p>
      <SampleView example={EXAMPLES_EN.execScripts} platform={platform} />
      <Table
        head={['Own attribute', 'Meaning']}
        rows={[
          [
            'cwd',
            'Folder to run the command in. If omitted, the page and then the top level are checked, then the launcher folder. Available as ${workDir}'
          ],
          ['env', 'Environment variables to add (name: value)'],
          ['encoding', 'Output encoding (default: cp932 for bat, utf-8 otherwise)']
        ]}
      />
      <p>
        You cannot type input into a command. Even if it waits for input, like <code>pause</code>,
        it continues without stopping.
      </p>

      <h3>Opening files and folders (open)</h3>
      <p>
        Files open in the same app as when you double-click them. Folders open in Explorer (Finder
        on Mac).
      </p>
      <SampleView example={EXAMPLES_EN.open} platform={platform} />

      <h3>Opening Office files (excel / powerpoint / word)</h3>
      <p>
        <code>readonly: true</code> opens the file read-only, which suits documents you do not want
        to overwrite by accident. It works only on Windows. On a Mac without Office, files open in
        the default app, such as Numbers, Keynote or Pages.
      </p>
      <SampleView example={EXAMPLES_EN.office} platform={platform} />

      <h3>Opening in the browser (url)</h3>
      <p>
        Opens in the default browser. Values in <code>params</code> are URL-encoded and added to the
        end, so you can write search words in any language as they are.
      </p>
      <p>
        Only URLs starting with <code>http</code>, <code>https</code> or <code>mailto</code> can be
        opened. The same applies to links in md and html, and to <code>ctx.url</code>. To open a
        shared folder with <code>file://</code>, list the allowed kinds at the top level, like{' '}
        <code>openSchemes: [http, https, mailto, file]</code>.
      </p>
      <SampleView example={EXAMPLES_EN.url} platform={platform} />

      <h3>Calling a JavaScript function (function)</h3>
      <p>
        Calls, by name, a function exported with <code>module.exports</code> from a JS file in{' '}
        <code>launcher/scripts/</code>. Use it for work that is hard to do with commands alone. The
        first time you press it, you are asked whether to allow running JS.
      </p>
      <SampleView example={EXAMPLES_EN.function} platform={platform} />
      <Code lang="javascript">{`// launcher/scripts/logs.js
module.exports = {
  openLogFolder(ctx) {
    ctx.log('Opening logs')   // write to the console
    ctx.open('logs')          // opens like open
  }
}`}</Code>
      <Table
        head={['In ctx', 'Meaning']}
        rows={[
          ['launcherDir', 'The launcher folder'],
          ['workDir', 'The working folder (functions run here too)'],
          ['env', 'Environment variables'],
          ['log(text)', 'Writes a line to the console'],
          ['open(path) etc.', 'Does what a button does (see Calling from functions)'],
          ['select', 'Values of select, radio and checkbox (ctx.select.target, etc.)'],
          ['lang', 'Display language (ja or en)']
        ]}
      />
      <p>
        To change which JS files are loaded, list files or folders in <code>scripts</code> at the
        top level.
      </p>
    </>
  )
}
