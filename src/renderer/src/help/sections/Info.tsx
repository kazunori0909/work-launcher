import { Code, Section } from '../parts'

/** ヘルプの章「Info ページ」 */
export function Info(): React.JSX.Element {
  return (
    <Section id="info" title="Info ページ">
      <p>
        OS・CPU・メモリ・GPU・ドライブ・IP アドレスなど、この PC の情報を出します。
        「テキストでコピー」で、問い合わせや不具合の報告にそのまま貼り付けられます。
        枠ごとにコピーするときは、見出しの右上のボタンを押します。
        環境変数・ツールのバージョン・レジストリは、設定に書いたものだけを出します。
      </p>
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
      <p>ツールはランチャーのフォルダで実行します。見つからなければ「未インストール」と出ます。</p>
      <p>
        レジストリのパスは引用符を付けずに書きます（<code>{'"…"'}</code> で囲むと <code>\</code>{' '}
        がエスケープになります）。<code>\</code> で終えるとキーの既定値を読みます。
      </p>
    </Section>
  )
}
