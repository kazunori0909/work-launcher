import { Code, Table } from '../../parts'

/** ヘルプの章「関数から呼び出す」（英語） */
export function Functions(): React.JSX.Element {
  return (
    <>
      <p>
        From a JS function called by function, you can do what buttons do. <code>ctx</code> has
        functions named after the YAML type keys. Use them to do several things in order, or to
        decide the next step from a result. Where to put functions and how to call them is in
        &quot;Adding buttons&quot;.
      </p>
      <Code lang="javascript">{`// launcher/scripts/build.js
module.exports = {
  async buildAndOpen(ctx) {
    // run a command and wait for it to finish (output goes to the console)
    const result = await ctx.sh('npm run build', { cwd: 'app' })
    if (result.code !== 0) {
      ctx.log('Build failed')
      return
    }
    await ctx.open('app/dist')                           // open a folder
    await ctx.excel('docs/spec.xlsx', { readonly: true })  // open in Excel
    await ctx.url('https://www.google.com/search', { params: { q: 'hello' } })
  }
}`}</Code>

      <h3>Cheat sheet</h3>
      <Table
        head={['YAML', 'In a function', 'Second argument']}
        rows={[
          ['open', "ctx.open('logs')", 'None'],
          ['url', "ctx.url('https://…', { params })", 'params'],
          ['excel / powerpoint / word', "ctx.excel('docs/spec.xlsx', { readonly })", 'readonly'],
          [
            'bat / sh / powershell / python',
            "ctx.sh('npm run build', { cwd })",
            'cwd / env / encoding / wait / console'
          ]
        ]}
      />
      <p>
        Only behavior can be written. Look-related attributes such as <code>label</code> and{' '}
        <code>icon</code> cannot. Path bases, variables like <code>{'${workDir}'}</code>, and the
        kinds of URL that can be opened are the same as in YAML. Write variables inside quotes (
        <code>&apos;</code> or <code>&quot;</code>), like <code>{"'${workDir}/out'"}</code>. Inside
        backquotes, they become JS template values.
      </p>
      <p>
        A multi-line command can be written in backquotes with the line breaks as they are. Blank
        lines at either end and leading spaces shared by every line are removed, so you can indent
        to match the function (just like <code>|</code> in YAML). Line breaks in <code>bat</code>{' '}
        become CRLF automatically. To use a settings variable there, put <code>\</code> before{' '}
        <code>$</code>.
      </p>
      <Code lang="javascript">{`await ctx.bat(\`
  cd tools
  call setup.bat
  build.bat \\\${select:target}
\`)`}</Code>

      <h3>Waiting for completion</h3>
      <p>
        Every function can be awaited with <code>await</code>. Running a command waits until it
        finishes and returns the exit code and output.
      </p>
      <Code lang="javascript">{`const result = await ctx.bat('build.bat')
ctx.log(\`Exit code: \${result.code}\`)   // code is null when stopped

// just start it without waiting (e.g. starting a server)
await ctx.sh('npm run dev', { wait: false })`}</Code>

      <p>
        Without <code>cwd</code>, commands run in the same working folder as the function (
        <code>ctx.workDir</code>). A relative <code>cwd</code> counts from the launcher folder, as
        in YAML. To point below the working folder, write <code>{"cwd: '${workDir}/tools'"}</code>.
        Paths for <code>ctx.open</code>, <code>ctx.excel</code> and so on count from the working
        folder, as in YAML.
      </p>
      <p>
        OS differences, such as <code>bat</code> being Windows-only, are also the same as in YAML.
        To branch by OS, check <code>process.platform</code>.
      </p>
      <Code lang="javascript">{`if (process.platform === 'win32') await ctx.bat('build.bat')
else await ctx.sh('./build.sh')`}</Code>

      <h3>Getting the output</h3>
      <p>
        The result of an awaited run has standard output in <code>stdout</code> and standard error
        in <code>stderr</code>. <code>console: false</code> keeps the run out of the console. Use it
        when you want to read the output yourself and decide what to show.
      </p>
      <Code lang="javascript">{`const r = await ctx.sh('git status --short', { console: false })
if (r.code !== 0) ctx.log(\`Failed: \${r.stderr}\`)
else if (r.stdout === '') ctx.log('No changes')
else ctx.log(\`Changes:\\n\${r.stdout}\`)`}</Code>
      <p>
        As in YAML, <code>bat</code> also echoes the commands it runs. When reading the output, put{' '}
        <code>@echo off</code> first (for a single line, add <code>@</code>, as in <code>@cd</code>
        ).
      </p>
      <Code lang="javascript">{`const r = await ctx.bat(\`
  @echo off
  git rev-parse --abbrev-ref HEAD
\`, { console: false })
ctx.log(\`Branch: \${r.stdout}\`)`}</Code>
      <p>
        A run with <code>console: false</code> is not listed as running, so it cannot be stopped
        from the window.
      </p>
      <h3>Changing values and whether items can be pressed</h3>
      <p>
        <code>ctx.set</code> and <code>ctx.reset</code> change the values of selects and the like,
        and <code>ctx.disable</code> and <code>ctx.enable</code> change whether items can be
        pressed. See &quot;Changing elements&quot;.
      </p>

      <h3>When something fails</h3>
      <p>
        A missing file or a command that cannot start throws an exception. If you <code>await</code>
        , the function stops there and the error appears in the console. To keep going, catch it
        with <code>try / catch</code>. Without <code>await</code>, the error goes to the console and
        the function continues. A command that ends with a non-zero exit code does not throw.
      </p>
      <Code lang="javascript">{`try {
  await ctx.open('logs/today.log')
} catch (e) {
  ctx.log('No log yet')
}`}</Code>
    </>
  )
}
