import { Callout, CheatSheet, Code, Fold, SampleView, Table } from '../../parts'
import { EXAMPLES, ITEM_CHEATS } from '../../examples'
import type { SectionProps } from '../../parts'

/** ヘルプの章「ボタンを追加」 */
export function Items({ platform }: SectionProps): React.JSX.Element {
  return (
    <>
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
          ['icon', 'アイコン名（→ レイアウトと装飾）。省略すると種類ごとの既定'],
          ['tooltip', 'マウスを乗せたときの説明'],
          ['confirm', '押したときに確認を出す文'],
          ['id', 'ローカル設定から置き換えるときの目印']
        ]}
      />
      <p>
        <code>label</code>、<code>tooltip</code>、<code>confirm</code> は、
        <code>{'{ ja: …, en: … }'}</code>{' '}
        と書くと、右上で選んだ言語に合わせて出し分けます。文字列のまま書いたものは、どの言語でもそのまま出ます。
      </p>
      <Code lang="yaml">{`- bat: deploy.bat
  label: { ja: デプロイ, en: Deploy }
  confirm: { ja: 本番に出しますか？, en: Deploy to production? }`}</Code>
      <p>
        ボタンに限らず、グループの見出し、ページのタブ名、見出し、md
        の本文など、画面に出る多くの文字を同じように書けます。くわしくは「設定ファイルの編集」の「言語ごとに書く」を見てください。
      </p>

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
      <Callout kind="warning">
        コマンドにキーで入力することはできません。<code>pause</code>{' '}
        のような入力待ちがあっても、止まらずに先へ進みます。
      </Callout>

      <h3>ファイル・フォルダを開く（open）</h3>
      <p>
        ファイルは、ダブルクリックしたときと同じアプリで開きます。フォルダはエクスプローラー（Mac
        では Finder）で開きます。
      </p>
      <SampleView example={EXAMPLES.open} platform={platform} />

      <h3>Office 製品を開く（excel / powerpoint / word）</h3>
      <p>
        <code>readonly: true</code>{' '}
        を書くと読み取り専用で開くので、うっかり上書きしたくない資料に向いています。
      </p>
      <SampleView example={EXAMPLES.office} platform={platform} />
      <Callout kind="note">
        <code>readonly</code> が効くのは Windows だけです。Mac で Office が入っていなければ、Numbers
        や Keynote、Pages など既定のアプリで開きます。
      </Callout>

      <h3>ブラウザで開く（url）</h3>
      <p>
        既定のブラウザで開きます。<code>params</code> に書いた値は URL
        エンコードしてから末尾に付けるので、日本語の検索語もそのまま書けます。
      </p>
      <SampleView example={EXAMPLES.url} platform={platform} />
      <p>
        開ける URL は、<code>http</code>、<code>https</code>、<code>mailto</code>{' '}
        で始まるものだけに絞っています。md や html の中のリンク、<code>ctx.url</code> も同じです。
      </p>
      <Fold title="file:// などほかの種類の URL を開きたいとき">
        <p>
          社内の共有フォルダを <code>file://</code> で開きたいときなどは、最上位の{' '}
          <code>openSchemes</code>{' '}
          に開いてよい種類を並べます。書いた種類だけが開けるので、既定の3つも並べてください。
        </p>
        <Code lang="yaml">{`openSchemes: [http, https, mailto, file]`}</Code>
        <p>
          <code>file</code> を許すと exe なども開けてしまうので、要る案件でだけ書いてください。
        </p>
      </Fold>

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
          ['open(path) など', 'ボタンと同じ動作を呼ぶ（→ 関数から呼び出す）'],
          ['select', 'select・radio・checkbox の値（ctx.select.target など）'],
          ['lang', '表示の言語（ja か en）']
        ]}
      />
      <p>
        読み込む JS は、最上位の <code>scripts</code> にファイルかフォルダを並べて変えられます。
      </p>
    </>
  )
}
