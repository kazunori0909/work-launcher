import { Code, Section } from '../parts'

/** ヘルプの章「Info ページ」 */
export function Info(): React.JSX.Element {
  return (
    <Section id="info" title="Info ページ">
      <p>
        OS、CPU、メモリ、GPU、ドライブ、IP アドレスなど、この PC
        の情報をまとめて出します。問い合わせや不具合の報告では、「テキストでコピー」を押せばそのまま貼り付けられます。枠ごとにコピーしたいときは、見出しの右上のボタンを押します。
      </p>
      <p>環境変数、ツールのバージョン、レジストリは、設定に書いたものだけを出します。</p>
      <Code>{`info:
  env: [JAVA_HOME, PATH]       # 表示する環境変数
  tools:
    - git                      # 組み込み: git node npm python java docker dotnet
                               #   Windows だけ: steam epic
    - node
    - name: Maven              # 組み込みに無いものはコマンドを書く
      command: mvn -v
      pattern: "Apache Maven ([\\d.]+)"   # 1つ目の ( ) を表示。省略時は1行目
  registry:                    # Windows だけ表示する
    - HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem\\LongPathsEnabled
    - name: JDK                # 表示名（省略時は値の名前）
      path: HKLM\\SOFTWARE\\JavaSoft\\JDK\\CurrentVersion
  drives: false                # ドライブを出さないとき`}</Code>
      <p>
        ツールのコマンドは、ランチャーのフォルダで実行します。見つからないときは「未インストール」と出ます。
      </p>
      <p>
        レジストリのパスには引用符を付けないでください。<code>{'"…"'}</code> で囲むと、
        <code>\</code> がエスケープの文字として読まれてしまいます。末尾を <code>\</code>{' '}
        で終えると、キーの既定値を読みます。
      </p>
    </Section>
  )
}
