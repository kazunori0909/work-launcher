import { CheatSheet, Code, SampleView, Section, Table } from '../parts'
import { EXAMPLES, ITEM_CHEATS } from '../examples'
import type { SectionProps } from '../parts'

/** ヘルプの章「ボタンを追加」 */
export function Items({ platform }: SectionProps): React.JSX.Element {
  return (
    <Section id="items" title="ボタンを追加">
      <h3>早見表</h3>
      <CheatSheet cheats={ITEM_CHEATS} platform={platform} />

      <h3>共通の属性</h3>
      <p>
        項目の種類は、書いたキーで決まります。<code>bat</code> を書けばコマンドを実行するボタン、
        <code>open</code>{' '}
        を書けばファイルを開くボタンです。このキーを「種類キー」と呼びます。下の属性は、どの種類にも書けます。
      </p>
      <Table
        head={['属性', '内容']}
        rows={[
          ['label', 'ボタンの文字。省略すると種類キーの値（コマンドの1行目やファイル名）'],
          ['icon', 'アイコン名（→ グループとアイコン）。省略すると種類ごとの既定'],
          ['tooltip', 'マウスを乗せたときの説明'],
          ['confirm', '押したときに確認を出す文'],
          ['id', 'ローカル設定から置き換えるときの目印']
        ]}
      />

      <h3>コマンドを実行する（bat / sh / powershell / python）</h3>
      <p>
        種類キーの値には、実行したいコマンドをそのまま書きます。出力はコンソールに出ます。使うシェルは
        OS によって違います。
      </p>
      <Table
        head={['キー', 'Windows', 'Mac']}
        rows={[
          ['bat', 'cmd', '押せない'],
          ['sh', 'Git Bash', 'bash'],
          ['powershell', 'pwsh（無ければ Windows PowerShell）', 'pwsh（入れておく）'],
          ['python', 'py（無ければ python）', 'python3']
        ]}
      />
      <p>シェルが見つからないときは、コンソールに理由が出ます。</p>
      <SampleView example={EXAMPLES.exec} platform={platform} />
      <p>
        2行以上書くときは、<code>|</code> の次の行から字下げして書きます。
      </p>
      <SampleView example={EXAMPLES.execOptions} platform={platform} />
      <p>PowerShell や Python でも書き方は変わりません。</p>
      <SampleView example={EXAMPLES.execScripts} platform={platform} />
      <Table
        head={['専用の属性', '内容']}
        rows={[
          [
            'cwd',
            'コマンドを動かすフォルダ。書かなければページ、最上位の順に探し、無ければランチャーのフォルダ。${workDir} で参照できる'
          ],
          ['env', '足す環境変数（名前: 値）'],
          ['encoding', '出力の文字コード（既定は bat が cp932、ほかは utf-8）']
        ]}
      />
      <p>
        コマンドにキーで入力することはできません。<code>pause</code>{' '}
        のような入力待ちがあっても、止まらずに先へ進みます。
      </p>

      <h3>ファイル・フォルダを開く（open）</h3>
      <p>
        ファイルは、ダブルクリックしたときと同じアプリで開きます。フォルダはエクスプローラー（Mac
        では Finder）で開きます。
      </p>
      <SampleView example={EXAMPLES.open} platform={platform} />

      <h3>Office 製品を開く（excel / powerpoint / word）</h3>
      <p>
        <code>readonly: true</code>{' '}
        を書くと読み取り専用で開くので、うっかり上書きしたくない資料に向いています。これが効くのは
        Windows だけです。Mac で Office が入っていなければ、Numbers や Keynote、Pages
        など既定のアプリで開きます。
      </p>
      <SampleView example={EXAMPLES.office} platform={platform} />

      <h3>ブラウザで開く（url）</h3>
      <p>
        既定のブラウザで開きます。<code>params</code> に書いた値は URL
        エンコードしてから末尾に付けるので、日本語の検索語もそのまま書けます。
      </p>
      <p>
        開ける URL は、<code>http</code>、<code>https</code>、<code>mailto</code>{' '}
        で始まるものだけに絞っています。md や html の中のリンク、<code>ctx.openUrl</code>{' '}
        も同じです。社内の共有フォルダを <code>file://</code> で開きたいときは、最上位に{' '}
        <code>openSchemes: [http, https, mailto, file]</code> のように、開いてよい種類を並べます。
      </p>
      <SampleView example={EXAMPLES.url} platform={platform} />

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

      <h3>JavaScript の関数を呼ぶ（function）</h3>
      <p>
        <code>launcher/scripts/</code> に置いた JS で <code>module.exports</code>{' '}
        した関数を、名前で呼びます。コマンドだけでは書きにくい処理に使います。初めて押したときは、JS
        を実行してよいかの確認が出ます。
      </p>
      <SampleView example={EXAMPLES.function} platform={platform} />
      <Code lang="javascript">{`// launcher/scripts/logs.js
module.exports = {
  openLogFolder(ctx) {
    ctx.log('ログを開きます')   // コンソールに書く
    ctx.open('logs')            // open と同じく開く
  }
}`}</Code>
      <Table
        head={['ctx の中身', '内容']}
        rows={[
          ['launcherDir', 'ランチャーのフォルダ'],
          ['workDir', '作業フォルダ（関数もここで動く）'],
          ['env', '環境変数'],
          ['log(text)', 'コンソールに1行書く'],
          ['open(path)', 'ファイル・フォルダを開く'],
          ['openUrl(url, params)', 'ブラウザで開く'],
          ['select', 'select・radio・checkbox の値（ctx.select.target など）']
        ]}
      />
      <p>
        読み込む JS は、最上位の <code>scripts</code> にファイルかフォルダを並べて変えられます。
      </p>

      <h3>改行と見出し（break / heading）</h3>
      <p>
        ボタンは横に並び、幅が足りなくなると折り返します。好きな位置で改行したいときは{' '}
        <code>break</code>、区切りに見出しを付けたいときは <code>heading</code> を書きます。
      </p>
      <SampleView example={EXAMPLES.layout} platform={platform} />
    </Section>
  )
}
