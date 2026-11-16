import { useContext } from 'react'
import { EmbedContext } from '../../components/embedContext'
import { CheatSheet, Code, SampleView, Section, Table } from '../parts'
import { EXAMPLES, LAYOUT_CHEATS } from '../examples'
import { IconBrowser } from '../IconBrowser'
import type { SectionProps } from '../parts'

/** ヘルプの章「レイアウトと装飾」（並べ方・枠・文章・アイコン） */
export function Display({ platform }: SectionProps): React.JSX.Element {
  const { onLink } = useContext(EmbedContext)
  return (
    <Section id="display" title="レイアウトと装飾">
      <h3>早見表</h3>
      <CheatSheet cheats={LAYOUT_CHEATS} platform={platform} />

      <h3>改行と見出し（break / heading）</h3>
      <p>
        ボタンは横に並び、幅が足りなくなると折り返します。好きな位置で改行したいときは{' '}
        <code>break</code>、区切りに見出しを付けたいときは <code>heading</code> を書きます。
      </p>
      <SampleView example={EXAMPLES.layout} platform={platform} />

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

      <h3>説明を書く（md / html）</h3>
      <p>
        ボタンではなく、その位置に文章を出します。作業の前の注意書きなどに使います。
        <code>md</code> には Markdown を直接書くか、md ファイルのパスを書きます。<code>html</code>{' '}
        に書いた <code>&lt;script&gt;</code> は動きません。
      </p>
      <SampleView example={EXAMPLES.embed} platform={platform} />
      <Code lang="yaml">{`- md: launcher/notes/release.md   # 1行で .md で終わればファイルを読む`}</Code>
      <p>
        値が1行で <code>.md</code>{' '}
        で終わるときだけ、ファイルのパスとして読みます。それ以外は本文として扱います。
      </p>
      <p>
        リンクや画像の相対パスは、ランチャーのフォルダから数えます。md
        ファイルに書いたものだけは、その md ファイルの場所から数えます。リンクを押すと、URL
        はブラウザで、ファイルは既定のアプリで開きます。画像は、ランチャーのフォルダの中にあるものしか出せません。
      </p>
      <p>
        つまずきやすいのは、本文に <code>: </code>（コロンと空白）が入るときです。
        <code>color: red</code> のような文を1行に続けて書くと、YAML
        のキーと読まれてしまいます。上の例のように <code>|</code>{' '}
        を書いて、次の行から本文を書いてください。
      </p>

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
