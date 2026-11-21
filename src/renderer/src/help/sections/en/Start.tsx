import { Code } from '../../parts'

/** ヘルプの章「はじめに」（英語） */
export function Start(): React.JSX.Element {
  return (
    <>
      <p>
        WorkLauncher puts the commands and documents you use often in a project behind buttons. You
        write the buttons in YAML in <code>launcher/config.yaml</code>. When you save, the window
        updates right away.
      </p>
      <p>
        To start, put an empty file named <code>work.launcher</code> and{' '}
        <code>launcher/config.yaml</code> in the project folder. This folder is called the
        &quot;launcher folder&quot;. In the settings you can refer to it as{' '}
        <code>{'${launcherDir}'}</code>.
      </p>

      <h3>Opening a project</h3>
      <p>
        On Windows, the easiest way is to put the portable <code>WorkLauncher.exe</code> in the same
        folder and double-click it. If you commit the exe to the repository, everyone on the team
        can open the project the same way. There is no portable version for Mac.
      </p>
      <p>
        If the app is installed, double-click <code>work.launcher</code> or drop it on the app icon.
        You can also choose it with &quot;Open Project…&quot; in the menu (<code>⌘O</code> /{' '}
        <code>Ctrl+O</code>). Each project opens in its own window. Recent projects are listed on
        the screen shown when you start the app by itself.
      </p>

      <h3>What goes in the folder</h3>
      <p>
        Only <code>work.launcher</code> and <code>config.yaml</code> are required. Add the other
        files when you need them.
      </p>
      <Code>{`<launcher folder>/
  WorkLauncher.exe       portable version (when bundled on Windows)
  work.launcher          marker (can be empty)
  launcher/
    config.yaml          shared settings (commit to the repository)
    config.local.yaml    your own settings (add to .gitignore)
    pages/*.yaml         pages split into separate files
    scripts/*.js         functions called from function
    console.yaml         console colors
    style.css            look and feel`}</Code>
      <p>This is the smallest setup. It makes a page with a single button.</p>
      <Code lang="yaml">{`version: 1
title: Project name
pages:
  - id: top
    title: Main
    items:
      - bat: build.bat
        label: Build`}</Code>
    </>
  )
}
