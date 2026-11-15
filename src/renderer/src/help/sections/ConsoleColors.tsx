import { Code, Section } from '../parts'

/** ヘルプの章「コンソールの色分け」 */
export function ConsoleColors(): React.JSX.Element {
  return (
    <Section id="console" title="コンソールの色分け">
      <p>
        <code>launcher/console.yaml</code>{' '}
        に、出力の行を色分けするルールを書きます。上から順に照合し、 最初に当たったものを使います。
      </p>
      <Code>{`rules:
  - pattern: "\\\\b(error|failed)\\\\b"   # 正規表現
flags: i                        # 大文字小文字を区別しない
level: error                    # error / warn / info / success / debug
  - pattern: "^WARN"
level: warn
color: "#d29922"                # 色を直接指定するとき`}</Code>
      <p>
        自分だけのルールは <code>launcher/console.local.yaml</code> に書くと、先に照合されます。
      </p>
    </Section>
  )
}
