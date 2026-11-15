import { Code, Section } from '../parts'

/** ヘルプの章「タイトルと見た目」 */
export function Look(): React.JSX.Element {
  return (
    <Section id="look" title="タイトルと見た目">
      <p>
        <code>title</code>{' '}
        は画面上部とウィンドウのタイトルに出ます。複数のランチャーを並べたときの見分けに使います。
        <code>style</code> に CSS ファイルを書くと見た目を変えられます。
      </p>
      <Code>{`# launcher/config.yaml
title: 案件名
style: launcher/style.css

/* launcher/style.css */
:root {
  --header-bg: #1a7f37;     /* 上部の帯の色 */
  --header-text: #ffffff;
}`}</Code>
      <p>
        ほかに <code>--accent</code>（選択中のタブ）・<code>--bg</code>・<code>--surface</code>・
        <code>--text</code>・<code>--muted</code>・<code>--border</code> を変えられます。
      </p>
    </Section>
  )
}
