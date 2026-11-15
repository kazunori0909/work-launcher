import { useContext } from 'react'
import { EmbedContext } from '../../components/embedContext'
import { SampleView, Section, Table } from '../parts'
import { EXAMPLES } from '../examples'
import { IconBrowser } from '../IconBrowser'
import type { SectionProps } from '../parts'

/** ヘルプの章「グループとアイコン」 */
export function Display({ platform }: SectionProps): React.JSX.Element {
  const { onLink } = useContext(EmbedContext)
  return (
    <Section id="display" title="グループとアイコン">
      <h3>グループ（group）</h3>
      <p>
        <code>items</code> に並べた項目を枠で囲みます。<code>group</code> の値が枠の見出しになり、
        <code>group:</code>{' '}
        とだけ書けば見出しのない枠になります。グループの中にグループは入れられません。
      </p>
      <SampleView example={EXAMPLES.group} platform={platform} />

      <h3>ボタングループ（buttons）</h3>
      <p>
        いくつかのボタンを隙間なくくっつけて、1つの塊に見せます。よく使うのは、読み取り専用で開くボタンの横に、編集用の小さなボタンを添える形です。
        <code>label: &apos;&apos;</code>{' '}
        と書くとアイコンだけのボタンになります。中に置けるのはボタンだけです。
      </p>
      <SampleView example={EXAMPLES.buttons} platform={platform} />

      <h3>アイコン（icon）</h3>
      <p>
        <code>icon</code> に{' '}
        <a
          href="https://lucide.dev/icons/"
          onClick={(e) => {
            e.preventDefault()
            onLink(e.currentTarget.href, '')
          }}
        >
          Lucide
        </a>{' '}
        （オープンソースのアイコン集）の名前を書きます。下の一覧で英語の名前を検索し、押すと{' '}
        <code>icon: 名前</code> がコピーされます。無い名前を書いたときは、画面上部に警告が出ます。
      </p>
      <Table
        head={['種類', '書かなかったときのアイコン']}
        rows={[
          ['bat・sh・powershell・python', 'terminal'],
          ['url', 'globe'],
          ['open', 'file（拡張子があるとき）・folder-open'],
          ['function', 'code']
        ]}
      />
      <p>
        アイコンを消したいときは <code>icon: &quot;&quot;</code> と書きます。
      </p>
      <IconBrowser />
    </Section>
  )
}
