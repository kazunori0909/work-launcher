import { t } from '../../../../../core/i18n'
import { Code, Table } from '../../parts'
import type { SectionProps } from '../../parts'

/** ヘルプの章「設定ファイルの編集」（英語） */
export function Edit({ launcherDir, onError }: SectionProps): React.JSX.Element {
  const openFolder = async (): Promise<void> => {
    const r = await window.launcher.openProjectFolder()
    if (r.error) onError(r.error)
  }
  const createLocal = async (): Promise<void> => {
    const r = await window.launcher.createLocalConfig()
    if (r.error) onError(r.error)
  }
  return (
    <>
      <p>This is the launcher folder that is open now.</p>
      <div className="help-row">
        <code>{launcherDir ?? t().help.notOpen}</code>
        {launcherDir && (
          <button className="item" onClick={openFolder}>
            Open folder
          </button>
        )}
      </div>
      <p>
        When you save, the app reloads the settings automatically. Open tabs and running commands
        keep going.
      </p>

      <h3>Your own settings</h3>
      <p>
        Buttons you want only on your own machine go in <code>launcher/config.local.yaml</code>. It
        is written the same way as <code>config.yaml</code>, and the app layers it on top of the
        shared settings. Add it to <code>.gitignore</code> and it will not appear for anyone else.
      </p>
      {launcherDir && (
        <div className="help-row">
          <button className="item" onClick={createLocal}>
            Create config.local.yaml
          </button>
        </div>
      )}
      <p>How it is layered depends on what you write.</p>
      <Table
        plain
        head={['Written locally', 'Result']}
        rows={[
          ['A page with the same ID as a shared one', 'Adds items to the end of that page'],
          ['Same, with replace: true', 'Replaces all items of that page'],
          ['An item with the same id as a shared one', 'Replaces that item in place'],
          ['A page with a new ID', 'Adds the page at the end'],
          ['title, cwd', 'Overrides'],
          ['style, scripts', 'Added after the shared ones'],
          ['tools in info', 'Added at the end (same name overrides; hidden: true hides it)']
        ]}
      />

      <h3>Adding pages</h3>
      <p>
        Tabs appear in the order written in <code>pages</code>. An <code>id</code> can use letters,
        digits, <code>-</code> and <code>_</code>. The <code>top</code> page is shown first when the
        project opens.
      </p>
      <p>
        When <code>config.yaml</code> gets long, you can move pages to other files with{' '}
        <code>include</code>. Each file holds one page.
      </p>
      <Code lang="yaml">{`pages:
  - id: top
    title: Main
    icon: house
    items: [...]
  - include: launcher/pages/tools.yaml

# launcher/pages/tools.yaml
id: tools
title: Tools
cwd: tools        # folder where this page's commands run
items: [...]`}</Code>
      <p>
        The ID <code>help</code> is reserved for this help. If you write a page with{' '}
        <code>id: help</code> in <code>pages</code>, its items appear as the first chapter of the
        help, named after the project&apos;s <code>title</code>. Use it for steps and notes specific
        to the project.
      </p>

      <h3>Writing per language</h3>
      <p>
        Text you want to show differently in Japanese and English is written as a{' '}
        <code>{'{ ja: …, en: … }'}</code> table. The value for the language chosen with the button
        at the top right is shown; if the table does not have that language, its first value is
        shown. Plain strings are shown as is in every language, so table only what you want to
        translate.
      </p>
      <Code lang="yaml">{`- id: top
  title: { ja: メイン, en: Main }
  items:
    - bat: deploy.bat
      label: { ja: デプロイ, en: Deploy }
    - md:
        ja: launcher/notes/setup.md     # split long text into files
        en: launcher/notes/setup.en.md`}</Code>
      <p>
        Tables can be used for the page and project <code>title</code>, <code>label</code>,{' '}
        <code>tooltip</code>, <code>confirm</code>, <code>heading</code>, the <code>group</code>{' '}
        heading, choice <code>label</code>s, <code>md</code> and <code>html</code>. In functions,{' '}
        <code>ctx.lang</code> tells you the display language (<code>ja</code> or <code>en</code>).
      </p>

      <h3>Changing the working folder (cwd)</h3>
      <p>
        Writing <code>cwd</code> at the top level of <code>config.yaml</code> changes the working
        folder (<code>{'${workDir}'}</code>). Use it when the launcher lives outside the project.
      </p>
      <Code>{`root/
  work-launcher/          ← \${launcherDir} (launcher folder)
    work.launcher
    launcher/
      config.yaml         ← cwd: ../project-hoge
      notes/setup.md
  project-hoge/           ← \${workDir} (working folder)
    bat/hoge.bat
    docs/spec.xlsx`}</Code>
      <Table
        plain
        head={['Where it is written', 'Relative to', 'In the example']}
        rows={[
          ['Commands (bat, sh, ...)', 'Working folder', 'project-hoge/'],
          ['open, excel, word, powerpoint', 'Working folder', 'project-hoge/'],
          ['md, style, scripts, include', 'Launcher folder', 'work-launcher/ (unchanged)'],
          ['cwd itself', 'Launcher folder', 'work-launcher/ (unchanged)']
        ]}
      />
      <Code lang="yaml">{`cwd: ../project-hoge
pages:
  - id: main
    items:
      - bat: bat\\hoge.bat              # project-hoge/bat/hoge.bat
      - excel: docs/spec.xlsx          # project-hoge/docs/spec.xlsx
      - md: launcher/notes/setup.md    # work-launcher/launcher/notes/setup.md
      - open: \${launcherDir}/launcher  # say so explicitly to open inside the launcher`}</Code>
      <p>
        Without <code>cwd</code>, the two are the same folder, so there is no difference. Writing{' '}
        <code>cwd</code> on a page or item makes that the working folder there.
      </p>
    </>
  )
}
