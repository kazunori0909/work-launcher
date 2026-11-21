/** ヘルプの章「エラーが出たとき」（英語） */
export function Errors(): React.JSX.Element {
  return (
    <>
      <p>Where an error appears depends on the kind of mistake.</p>
      <p>
        If the file cannot be read as YAML, an error screen is shown instead of the pages. It shows
        the file name and line number, so look at that line first. Common causes are wrong
        indentation and a missing space after a colon.
      </p>
      <p>
        If only one item is wrong, a red error appears in its place, for example when the type key (
        <code>bat</code>, <code>open</code>, ...) is missing or there are two of them. The other
        items work as usual.
      </p>
      <p>
        Unknown keys and icon names that do not exist show a warning in &quot;Settings
        problems&quot; at the top of the window. The window still works, so check the spelling and
        fix it.
      </p>
      <p>
        When a command fails or a file cannot be opened, the console opens and shows the reason.
      </p>
    </>
  )
}
