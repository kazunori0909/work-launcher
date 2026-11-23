// サンプルの関数。function から呼ぶ（書き方は docs/config.md 3.2）
module.exports = {
  // ctx.lang は表示の言語（ja / en）
  hello(ctx) {
    ctx.log(ctx.lang === 'ja' ? 'sample-scripts.js からこんにちは' : 'Hello from sample-scripts.js')
    ctx.log(`launcherDir: ${ctx.launcherDir}`)
    ctx.log(`workDir: ${ctx.workDir}`)
  },

  // select の値は ctx.select で受け取る。release のときは、デバッグ用のグループの値を出さない
  showSelect(ctx) {
    const values = { ...ctx.select }
    if (values.mode === 'release') {
      delete values['log-level']
      delete values['log-file']
    }
    ctx.log(`select: ${JSON.stringify(values)}`)
  },

  // select の change から呼ぶ。変えた項目は ctx.changed で受け取る
  onTargetChange(ctx) {
    const { id, value, previous } = ctx.changed
    ctx.log(`${id}: ${previous} → ${value}`)
  },

  // モードを release にすると、デバッグ用のグループ（id: debug-tools）を中の項目ごと押せなくする
  async onModeChange(ctx) {
    if (ctx.changed.value === 'release') await ctx.disable('debug-tools')
    else await ctx.enable('debug-tools')
  },

  // デバッグ用のグループ（id: debug-tools）の中の select・checkbox を初期値に戻す
  // 初期値は YAML の default（無ければ最初の選択肢、checkbox はオフ）
  async resetDebug(ctx) {
    await ctx.reset('debug-tools')
    // 1つずつ戻す・初期値と違う値にするなら、ctx.set で値を書く
    // await ctx.set('log-level', 'middle')
    // await ctx.set('log-file', false) // checkbox は true / false でも書ける
  },

  // ボタンと同じ動作を呼ぶ。実行系は終わるまで待ち、終了コードと出力を返す
  async runAndOpen(ctx) {
    const run = process.platform === 'win32' ? ctx.bat : ctx.sh
    const shown = await run('echo Hello from ${workDir}')
    ctx.log(`終了コード: ${shown.code}`)
    // console: false ならコンソールに出さない。出力は stdout・stderr で受け取る
    // bat は実行したコマンドも出力に出るので、読むときは @ を付ける
    const quiet = process.platform === 'win32' ? '@echo hidden' : 'echo hidden'
    const hidden = await run(quiet, { console: false })
    ctx.log(`受け取った出力: ${hidden.stdout}`)
    await ctx.open('launcher')
  },

  // 数える間は、全部の項目を押せなくする（ctx.disable に ID を渡せば、その項目だけ）
  // 引数なしの ctx.enable() は「全部」だけを戻すので、ID で押せなくした項目はそのまま
  async slowCount(ctx) {
    await ctx.disable()
    try {
      for (let i = 1; i <= 3; i++) {
        ctx.log(`count ${i}`)
        await new Promise((r) => setTimeout(r, 300))
      }
    } finally {
      await ctx.enable()
    }
  }
}
