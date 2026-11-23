import { Code } from '../../parts'

/** ヘルプの章「コンソールの色分け」（英語） */
export function ConsoleColors(): React.JSX.Element {
  return (
    <>
      <p>
        Command output can be colored line by line. Coloring lines that contain error makes failures
        harder to miss in long logs.
      </p>
      <p>
        Write the rules in <code>launcher/console.yaml</code>. The app checks them from the top and
        uses the first rule that matches.
      </p>
      <Code lang="yaml">{`rules:
  - pattern: "\\\\b(error|failed)\\\\b"   # regular expression
    flags: i                          # ignore case
    level: error                      # error / warn / info / success / debug
  - pattern: "^WARN"
    level: warn
    color: "#d29922"                  # to set a color directly`}</Code>
      <p>
        Your own rules go in <code>launcher/console.local.yaml</code>. They are checked first.
      </p>
      <p>
        &ldquo;Warnings and up&rdquo; and &ldquo;Errors only&rdquo; in the console filter lines by
        level. For a run with a matching line, its start and end lines are kept too.
      </p>
    </>
  )
}
