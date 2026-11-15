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
        項目の種類は、どのキーを書いたかで決まります（<code>bat</code> なら実行、
        <code>open</code> なら開く）。
        <br />
        どの種類にも次の属性を書けます。
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
      <p>値はスクリプトの本文です。出力はコンソールに出ます。</p>
      <Table
        head={['キー', 'Windows', 'Mac']}
        rows={[
          ['bat', 'cmd', '押せない'],
          ['sh', 'Git Bash', 'bash'],
          ['powershell', 'pwsh（無ければ Windows PowerShell）', 'pwsh（入れておく）'],
          ['python', 'py（無ければ python）', 'python3']
        ]}
      />
      <p>見つからないときは、コンソールに理由が出ます。</p>
      <SampleView example={EXAMPLES.exec} platform={platform} />
      <p>
        複数行は <code>|</code> の後に字下げして書きます。
      </p>
      <SampleView example={EXAMPLES.execOptions} platform={platform} />
      <p>PowerShell・Python も、同じように本文を書きます。</p>
      <SampleView example={EXAMPLES.execScripts} platform={platform} />
      <Table
        head={['専用の属性', '内容']}
        rows={[
          [
            'cwd',
            '作業フォルダ（項目 → ページ → 最上位の順に引き継ぐ。既定はランチャーのフォルダ。${workDir} で参照できる）'
          ],
          ['env', '足す環境変数（名前: 値）'],
          ['encoding', '出力の文字コード（既定は bat が cp932、ほかは utf-8）']
        ]}
      />
      <p>
        入力は受け付けません。<code>pause</code> などの入力待ちは止まらずに進みます。
      </p>

      <h3>ファイル・フォルダを開く（open）</h3>
      <p>OS の既定のアプリで開きます。フォルダならエクスプローラー・Finder で開きます。</p>
      <SampleView example={EXAMPLES.open} platform={platform} />

      <h3>Office 製品を開く（excel / powerpoint / word）</h3>
      <p>
        <code>readonly: true</code> で読み取り専用で開きます（Windows のみ）。
        <br />
        Mac では Office が入っていなければ Numbers・Keynote・Pages など既定のアプリで開きます。
      </p>
      <SampleView example={EXAMPLES.office} platform={platform} />

      <h3>ブラウザで開く（url）</h3>
      <p>
        既定のブラウザで開きます。<code>params</code> は自動で URL エンコードして付けます。
      </p>
      <SampleView example={EXAMPLES.url} platform={platform} />

      <h3>説明を書く（md / html）</h3>
      <p>
        ボタンにはならず、その位置に文章を出します。<code>md</code> には Markdown
        の本文を直接書くか、md ファイルのパスを書きます。<code>html</code> の{' '}
        <code>&lt;script&gt;</code> は実行されません。
      </p>
      <SampleView example={EXAMPLES.embed} platform={platform} />
      <Code>{`- md: launcher/notes/release.md   # 1行で .md で終わればファイルを読む`}</Code>
      <ul>
        <li>
          値が1行だけで <code>.md</code> で終わればファイルのパス、それ以外は本文として扱います。
        </li>
        <li>
          リンクと画像の相対パスはランチャーのフォルダが起点です。md ファイルの中だけは、その md
          ファイルの位置が起点です。
        </li>
        <li>外部の URL はブラウザで、ファイルは OS の既定のアプリで開きます。</li>
        <li>表示できるのはランチャーのフォルダの中の画像だけです。</li>
        <li>
          本文に <code>: </code>（<code>color: red</code> など）を含むときは、例のように{' '}
          <code>|</code> の次の行から書きます（1行に続けて書くと YAML のキーと読まれます）。
        </li>
      </ul>

      <h3>JavaScript の関数を呼ぶ（function）</h3>
      <p>
        <code>launcher/scripts/</code> の JS が <code>module.exports</code>{' '}
        している関数を名前で呼びます。初めて押したときに、実行してよいか確認が出ます。
      </p>
      <SampleView example={EXAMPLES.function} platform={platform} />
      <Code>{`// launcher/scripts/logs.js
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
        読む JS は最上位の <code>scripts</code> で変えられます（ファイルかフォルダを並べる）。
      </p>

      <h3>改行と見出し（break / heading）</h3>
      <p>ボタンは横に並び、幅が足りなければ折り返します。好きな位置で行を変えるときに使います。</p>
      <SampleView example={EXAMPLES.layout} platform={platform} />
    </Section>
  )
}
