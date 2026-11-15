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
        <code>items</code> に並べた項目を枠で囲みます。値は枠の見出しで、
        <code>group:</code> だけなら見出しを出しません。グループの中にグループは置けません。
      </p>
      <SampleView example={EXAMPLES.group} platform={platform} />

      <h3>ボタングループ（buttons）</h3>
      <p>
        並べたボタンをくっつけて、1つの塊にします。ふだんは読み取り専用で開き、編集するときだけ横の小さなボタンで開く、
        のように使います。<code>label: &apos;&apos;</code>{' '}
        でアイコンだけのボタンになります。中に置けるのはボタンだけです。
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
        のアイコン名を書きます。下の一覧で探し、押すと <code>icon: 名前</code> をコピーできます。
        無い名前を書くと、画面上部に警告が出ます。
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
        アイコンを出したくないときは <code>icon: &quot;&quot;</code> と書きます。
      </p>
      <IconBrowser />
    </Section>
  )
}
