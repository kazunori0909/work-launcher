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

  // 値を JS から変える（ctx.set）。checkbox は true / false でも書ける
  // 変えた値で、YAML の disabledWhen・enabledWhen もそのまま切り替わる
  async releasePreset(ctx) {
    await ctx.set('target', 'prod')
    await ctx.set('mode', 'release')
    await ctx.set('dry', true)
    ctx.log(`select: ${JSON.stringify(ctx.select)}`)
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
