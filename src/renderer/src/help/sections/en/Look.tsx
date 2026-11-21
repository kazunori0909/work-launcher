import { Code } from '../../parts'

/** ヘルプの章「タイトルと見た目」（英語） */
export function Look(): React.JSX.Element {
  return (
    <>
      <p>
        <code>title</code> is shown at the top of the window and in the window title. It helps you
        tell projects apart when several are open.
      </p>
      <p>
        Giving each project its own color for the top bar makes them even easier to tell apart.
        Write a CSS file in <code>style</code> to change colors and other looks.
      </p>
      <Code lang="yaml">{`# launcher/config.yaml
title: Project name
style: launcher/style.css`}</Code>
      <Code lang="css">{`/* launcher/style.css */
:root {
  --header-bg: #1a7f37;     /* top bar color */
  --header-text: #ffffff;
}`}</Code>
      <p>
        Other colors you can change are <code>--accent</code> (the selected tab), <code>--bg</code>,{' '}
        <code>--surface</code>, <code>--text</code>, <code>--muted</code> and <code>--border</code>.
      </p>
    </>
  )
}
