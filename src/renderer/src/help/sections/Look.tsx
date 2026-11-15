import { Code, Section } from '../parts'

/** ヘルプの章「タイトルと見た目」 */
export function Look(): React.JSX.Element {
  return (
    <Section id="look" title="タイトルと見た目">
      <p>
        <code>title</code>{' '}
        は画面上部とウィンドウのタイトルに出ます。いくつもの案件を開いているときの見分けに使えます。
      </p>
      <p>
        上部の帯の色を案件ごとに変えておくと、もっと区別しやすくなります。<code>style</code> に CSS
        ファイルを書けば、色などの見た目を変えられます。
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
        ほかに変えられる色は <code>--accent</code>（選択中のタブ）、<code>--bg</code>、
        <code>--surface</code>、<code>--text</code>、<code>--muted</code>、<code>--border</code>{' '}
        です。
      </p>
    </Section>
  )
}
