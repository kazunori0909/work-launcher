import { Code, Section } from '../parts'

/** ヘルプの章「ページの追加」 */
export function Pages(): React.JSX.Element {
  return (
    <Section id="pages" title="ページの追加">
      <p>
        タブは <code>pages</code> に書いた順に並びます。<code>id</code> に使えるのは英数字と{' '}
        <code>-</code>、<code>_</code> です。<code>top</code>{' '}
        のページは、案件を開いたときに最初に出ます。
      </p>
      <p>
        ページが増えて <code>config.yaml</code> が長くなったら、<code>include</code>{' '}
        で別のファイルに分けられます。1つのファイルには1ページ分を書きます。
      </p>
      <Code>{`pages:
  - id: top
    title: メイン
    icon: house
    items: [...]
  - include: launcher/pages/tools.yaml

# launcher/pages/tools.yaml
id: tools
title: ツール
cwd: tools        # このページのコマンドを動かすフォルダ
items: [...]`}</Code>
      <p>
        <code>help</code> という ID は、このヘルプのために取ってあります。<code>pages</code> に{' '}
        <code>id: help</code>{' '}
        のページを書くと、その項目がヘルプのいちばん上の章に出ます。章の名前は案件の{' '}
        <code>title</code> です。案件ならではの手順やメモを置く場所に使えます。
      </p>
    </Section>
  )
}
