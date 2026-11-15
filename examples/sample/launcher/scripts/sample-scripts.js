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

  async slowCount(ctx) {
    for (let i = 1; i <= 3; i++) {
      ctx.log(`count ${i}`)
      await new Promise((r) => setTimeout(r, 300))
    }
  }
}
