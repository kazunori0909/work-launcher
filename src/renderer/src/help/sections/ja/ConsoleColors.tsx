import { Code } from '../../parts'

/** ヘルプの章「コンソールの色分け」 */
export function ConsoleColors(): React.JSX.Element {
  return (
    <>
      <p>
        コマンドの出力を、行ごとに色分けできます。error
        を含む行に色を付けておけば、長いログの中でも失敗を見落としにくくなります。
      </p>
      <p>
        ルールは <code>launcher/console.yaml</code>{' '}
        に書きます。アプリは上から順に照合して、最初に当たったルールを使います。
      </p>
      <Code lang="yaml">{`rules:
  - pattern: "\\\\b(error|failed)\\\\b"   # 正規表現
    flags: i                          # 大文字小文字を区別しない
    level: error                      # error / warn / info / success / debug
  - pattern: "^WARN"
    level: warn
    color: "#d29922"                  # 色を直接指定するとき`}</Code>
      <p>
        自分だけのルールは <code>launcher/console.local.yaml</code>{' '}
        に書きます。こちらを先に照合します。
      </p>
    </>
  )
}
