import { BUILTIN_TOOLS, toolHelp } from '../../../../../core/builtinTools'
import { Callout, Code, Fold, Table } from '../../parts'

/** ヘルプの章「Info ページ」 */
export function Info(): React.JSX.Element {
  return (
    <>
      <p>
        OS、CPU、メモリ、GPU、ドライブ、IP アドレスなど、この PC
        の情報をまとめて出します。問い合わせや不具合の報告では、「テキストでコピー」を押せばそのまま貼り付けられます。枠ごとにコピーしたいときは、見出しの右上のボタンを押します。
      </p>
      <p>環境変数、ツールのバージョン、レジストリは、設定に書いたものだけを出します。</p>
      <Code lang="yaml">{`info:
  env: [JAVA_HOME, PATH]       # 表示する環境変数
  tools:
    - git                      # 組み込みのツールは名前だけ書く（下の表）
    - node
    - name: Maven              # 組み込みに無いものはコマンドを書く
      command: mvn -v
      pattern: "Apache Maven ([\\d.]+)"   # 1つ目の ( ) を表示。省略時は1行目
  registry:                    # Windows だけ表示する
    - HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem\\LongPathsEnabled
    - name: JDK                # 表示名（省略時は値の名前）
      path: HKLM\\SOFTWARE\\JavaSoft\\JDK\\CurrentVersion
  drives: false                # ドライブを出さないとき`}</Code>
      <Callout kind="warning">
        レジストリのパスには引用符を付けないでください。<code>{'"…"'}</code> で囲むと、
        <code>\</code> がエスケープの文字として読まれてしまいます。
      </Callout>
      <p>
        レジストリのパスの末尾を <code>\</code> で終えると、キーの既定値を読みます。
      </p>
      <h3>組み込みのツール</h3>
      <p>
        <code>tools</code>{' '}
        に名前を書くだけで出せるツールです。バージョンの取り方は書かなくてかまいません。どれも
        Windows と Mac で使えます。ここに無いものは、上の Maven のように <code>command</code> と{' '}
        <code>pattern</code> を書きます。
      </p>
      <Table
        head={['名前', '出すもの']}
        rows={BUILTIN_TOOLS.map((t) => [t.name, toolHelp(t, 'ja')])}
      />
      <p>
        ツールのコマンドは、ランチャーのフォルダで実行します。見つからないときは「未インストール」、出力が{' '}
        <code>pattern</code> に当たらないときは「pattern が一致しません」と出ます。Steam
        は、一度も起動していなければ「未インストール」と出ます。
      </p>
      <p>
        ツールの枠の下の「脆弱性を調べる（Zero Wire）」を押すと、Cloudflare
        の脆弱性の情報のサイトを既定のブラウザで開きます。製品名を入れると、その製品の脆弱性を探せます。アプリからは何も送りません。
      </p>
      <Fold title="組み込みのツールが取れなくなったとき">
        <p>
          ツール側の取り方が変わって組み込みで取れなくなったときは、同じ名前で <code>command</code>{' '}
          や <code>pattern</code> を書くと上書きできます。<code>command</code> を書くと{' '}
          <code>pattern</code> とまとめて置き換わり、どの OS でもそのコマンドを使います。
          <code>pattern</code> だけなら、組み込みのコマンドの出力から抜き出し方だけを変えます。
        </p>
        <Code lang="yaml">{`info:
  tools:
    - name: steam              # 表示名は Steam のまま
      pattern: '"version"\\s+"(\\d+)"'`}</Code>
      </Fold>
      <h3>自分の PC だけツールを変える</h3>
      <p>
        <code>config.local.yaml</code> の <code>tools</code>{' '}
        に書いたツールは、共通の設定の後ろに足されます。共通の設定にあるツールを出したくないときは、同じ名前で{' '}
        <code>hidden: true</code> を書きます。
      </p>
      <Code lang="yaml">{`info:
  tools:
    - { name: node, hidden: true }   # 共通の設定の node を出さない
    - name: Maven                    # 自分だけ使うツールを足す
      command: mvn -v`}</Code>
    </>
  )
}
