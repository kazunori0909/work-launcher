import { Code, Section } from '../parts'

/** ヘルプの章「ページの追加」 */
export function Pages(): React.JSX.Element {
  return (
    <Section id="pages" title="ページの追加">
      <p>
        <code>pages</code> に並べた順にタブが出ます。ページを別ファイルに分けるときは{' '}
        <code>include</code> を書きます（1ファイルに1ページ）。
      </p>
      <Code>{`pages:
  - id: top                 # 英数字と - _。top は最初に開くページ
title: メイン
icon: house
items: [...]
  - include: launcher/pages/tools.yaml

# launcher/pages/tools.yaml
id: tools
title: ツール
cwd: tools                  # このページのコマンドの作業フォルダ
items: [...]`}</Code>
      <p>
        <code>help</code>（このページ）は予約されています。同じ ID のページを書くと、
        その項目がヘルプの最初の章「この案件」に出ます。
      </p>
    </Section>
  )
}
