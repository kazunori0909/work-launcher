import { useContext } from 'react'
import { EmbedContext } from '../../../components/embedContext'
import { CheatSheet, Code, SampleView, Table } from '../../parts'
import { EXAMPLES, LAYOUT_CHEATS } from '../../examples'
import { IconBrowser } from '../../IconBrowser'
import type { SectionProps } from '../../parts'

/** ヘルプの章「レイアウトと装飾」（並べ方・枠・文章・アイコン） */
export function Display({ platform }: SectionProps): React.JSX.Element {
  const { onLink } = useContext(EmbedContext)
  return (
    <>
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

      <h3>折りたたみ（details）</h3>
      <p>
        見出しを押すと、中身が開いたり閉じたりします。ふだんは見せなくてよい説明や、たまにしか使わないボタンをしまっておけます。
        短い文なら <code>text</code> に書き、ボタンなども入れたいときは group と同じく{' '}
        <code>items</code> に並べます。
      </p>
      <SampleView example={EXAMPLES.details} platform={platform} />
      <Table
        head={['キー', '内容']}
        rows={[
          ['details', '見出し'],
          ['text', '中に出す文（書いたまま、改行もそのまま）'],
          ['items', '中に置く項目（details や group も置ける）'],
          ['expanded', 'true なら開いた状態で出す（省略時は閉じる）'],
          ['frame', 'true なら枠で囲む（省略時は枠なし）']
        ]}
      />
      <p>
        <code>text</code> と <code>items</code> の両方を書くと、text
        を先に出します。開閉は覚えないので、ページを開き直すと書いたとおりに戻ります。
      </p>

      <h3>アラート（note・tip・important・warning・caution）</h3>
      <p>
        色付きの枠で、注意書きを目立たせます。種類は5つで、見出しにアイコンと種類の名前が出ます。
      </p>
      <SampleView example={EXAMPLES.alert} platform={platform} />
      <p>
        本文は書いたままの文です。太字やリンクを使いたいときは、<code>md</code>{' '}
        に引用の形で書き、1行目に <code>[!NOTE]</code> のような印を置きます（
        <code>[!TIP]</code>・<code>[!IMPORTANT]</code>・<code>[!WARNING]</code>・
        <code>[!CAUTION]</code>）。md ファイルの中でも同じように書けます。
      </p>
      <SampleView example={EXAMPLES.alertMd} platform={platform} />

      <h3>画像（image）</h3>
      <p>
        画像を出します。押すと、ウィンドウの中に大きく出します（閉じるボタン・Esc・背景を押すと閉じる）。
      </p>
      <Code lang="yaml">{`- image: launcher/img/構成図.png
  width: 50%      # 数値なら px（width: 300）、% はページの幅に対する割合
  label: 構成図    # 画像を読めないときの代わりの文字（省略可）
- image: launcher/img/logo.svg
  width: 96
  zoom: false     # 押しても大きくしない`}</Code>
      <p>
        ほかの項目と同じく横に並びます。<code>width: 50%</code>{' '}
        を2つ書けば、ちょうど1行に並びます。width を省くと画像の大きさのまま出します。出せる画像は
        md と同じで、ランチャーのフォルダの中のファイルと <code>https</code> の URL です。
      </p>

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
    </>
  )
}
