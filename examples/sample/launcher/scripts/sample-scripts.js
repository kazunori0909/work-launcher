// サンプルの関数。function から呼ぶ（書き方は docs/config.md 3.2）
module.exports = {
  hello(ctx) {
    ctx.log('Hello from sample-scripts.js')
    ctx.log(`launcherDir: ${ctx.launcherDir}`)
    ctx.log(`workDir: ${ctx.workDir}`)
  },

  // select の値は ctx.select で受け取る
  showSelect(ctx) {
    ctx.log(`select: ${JSON.stringify(ctx.select)}`)
  },

  // select の change から呼ぶ。変えた項目は ctx.changed で受け取る
  onTargetChange(ctx) {
    const { id, value, previous } = ctx.changed
    ctx.log(`${id}: ${previous} → ${value}`)
  },

  // ボタンと同じ動作を呼ぶ。実行系は終わるまで待ち、終了コードと出力を返す
  async runAndOpen(ctx) {
    const run = process.platform === 'win32' ? ctx.bat : ctx.sh
    const shown = await run('echo Hello from ${workDir}')
    ctx.log(`終了コード: ${shown.code}`)
    // console: false ならコンソールに出さない。出力は stdout・stderr で受け取る
    const hidden = await run('echo hidden', { console: false })
    ctx.log(`受け取った出力: ${hidden.stdout}`)
    await ctx.open('launcher')
  },

  async slowCount(ctx) {
    for (let i = 1; i <= 3; i++) {
      ctx.log(`count ${i}`)
      await new Promise((r) => setTimeout(r, 300))
    }
  }
}
