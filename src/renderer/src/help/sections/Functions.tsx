import { Code, Section, Table } from '../parts'

/** ヘルプの章「関数から呼び出す」 */
export function Functions(): React.JSX.Element {
  return (
    <Section id="functions" title="関数から呼び出す">
      <p>
        function で呼ぶ JS の関数の中から、ボタンと同じ動作を呼べます。<code>ctx</code> に、YAML
        の種類キーと同じ名前の関数があります。いくつかの動作を順に行う、結果を見て次を決める、
        といった処理に使います。関数の置き場所と呼び方は「ボタンを追加」の章を見てください。
      </p>
      <Code lang="javascript">{`// launcher/scripts/build.js
module.exports = {
  async buildAndOpen(ctx) {
    // コマンドを実行し、終わるまで待つ（出力はコンソールに出る）
    const result = await ctx.sh('npm run build', { cwd: 'app' })
    if (result.code !== 0) {
      ctx.log('ビルドに失敗しました')
      return
    }
    await ctx.open('app/dist')                              // フォルダを開く
    await ctx.excel('docs/仕様書.xlsx', { readonly: true })  // Excel で開く
    await ctx.url('https://www.google.com/search', { params: { q: 'ほげほげ' } })
  }
}`}</Code>

      <h3>早見表</h3>
      <Table
        head={['YAML', '関数の中', '2つ目の引数に書けるもの']}
        rows={[
          ['open', "ctx.open('logs')", 'なし'],
          ['url', "ctx.url('https://…', { params })", 'params'],
          ['excel / powerpoint / word', "ctx.excel('docs/仕様書.xlsx', { readonly })", 'readonly'],
          [
            'bat / sh / powershell / python',
            "ctx.sh('npm run build', { cwd })",
            'cwd / env / encoding / wait / console'
          ]
        ]}
      />
      <p>
        書けるのは動作に関わるものだけです。<code>label</code> や <code>icon</code>{' '}
        のような見た目の属性は書けません。パスの起点や <code>{'${workDir}'}</code>{' '}
        などの変数、開ける URL の種類は、YAML に書いたときと同じです。変数は{' '}
        <code>{"'${workDir}/out'"}</code> のように引用符（<code>&apos;</code> か <code>&quot;</code>
        ）の中に書きます。バッククォートの中では JS の値の埋め込みになります。
      </p>
      <p>
        何行もあるコマンドは、バッククォートで囲んで改行をそのまま書けます。前後の空行と、
        どの行にも共通する先頭の空白は取り除くので、関数に合わせてインデントしてかまいません（YAML
        の <code>|</code> と同じです）。<code>bat</code> の改行は自動で CRLF
        にします。その中で設定の変数を使うときは、<code>$</code> の前に <code>\</code> を付けます。
      </p>
      <Code lang="javascript">{`await ctx.bat(\`
  cd tools
  call setup.bat
  build.bat \\\${select:target}
\`)`}</Code>

      <h3>終わるのを待つ</h3>
      <p>
        どの関数も <code>await</code>{' '}
        で終わるのを待てます。コマンドの実行は、終わるまで待って終了コードと出力を返します。
      </p>
      <Code lang="javascript">{`const result = await ctx.bat('build.bat')
ctx.log(\`終了コード: \${result.code}\`)   // 止めたときは code が null

// 待たずに始めるだけにする（サーバーの起動など）
await ctx.sh('npm run dev', { wait: false })`}</Code>

      <p>
        <code>cwd</code> を書かなければ、関数と同じ作業フォルダ（<code>ctx.workDir</code>
        ）で動きます。相対パスで書いた <code>cwd</code> は、YAML
        と同じくランチャーのフォルダが起点です。作業フォルダの下を指すときは{' '}
        <code>{"cwd: '${workDir}/tools'"}</code> と書きます。<code>ctx.open</code>・
        <code>ctx.excel</code> などのパスは、YAML と同じく作業フォルダが起点です。
      </p>
      <p>
        <code>bat</code> は Windows だけ、といった OS ごとの違いも YAML と同じです。OS
        で分けたいときは <code>process.platform</code> を見ます。
      </p>
      <Code lang="javascript">{`if (process.platform === 'win32') await ctx.bat('build.bat')
else await ctx.sh('./build.sh')`}</Code>

      <h3>出力を受け取る</h3>
      <p>
        待った実行の結果には、標準出力が <code>stdout</code>、標準エラー出力が <code>stderr</code>{' '}
        に入ります。<code>console: false</code>{' '}
        を書くと、その実行をコンソールに出しません。出力を自分で読んで、出す文を決めたいときに使います。
      </p>
      <Code lang="javascript">{`const r = await ctx.sh('git status --short', { console: false })
if (r.code !== 0) ctx.log(\`失敗しました: \${r.stderr}\`)
else if (r.stdout === '') ctx.log('変更はありません')
else ctx.log(\`変更があります:\\n\${r.stdout}\`)`}</Code>
      <p>
        <code>bat</code> は、YAML と同じく実行したコマンドも出力に出ます。出力を読むときは、先頭に{' '}
        <code>@echo off</code> を書きます（1行だけなら <code>@cd</code> のように <code>@</code>{' '}
        を付けます）。
      </p>
      <Code lang="javascript">{`const r = await ctx.bat(\`
  @echo off
  git rev-parse --abbrev-ref HEAD
\`, { console: false })
ctx.log(\`ブランチ: \${r.stdout}\`)`}</Code>
      <p>
        <code>console: false</code> の実行は、実行中の一覧に出ないので画面からは止められません。
      </p>
      <h3>失敗したとき</h3>
      <p>
        ファイルが無い、コマンドを始められない、といったときは例外になります。<code>await</code>{' '}
        していれば関数はそこで止まり、コンソールにエラーが出ます。続けたいときは{' '}
        <code>try / catch</code> で受けます。<code>await</code>{' '}
        しなかったときは、エラーをコンソールに出して関数は先へ進みます。 コマンドが 0
        以外の終了コードで終わったときは、例外にはなりません。
      </p>
      <Code lang="javascript">{`try {
  await ctx.open('logs/today.log')
} catch (e) {
  ctx.log('まだログがありません')
}`}</Code>
    </Section>
  )
}
