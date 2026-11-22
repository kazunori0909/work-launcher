import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'site/*.test.ts'],
    // テストファイルごとに作業プロセスを作り直さない（全体で約 4 割速い）。
    // そのため、モジュールの状態を書き換えるテスト（vi.mock・グローバルの変更など）は書かない
    isolate: false,
    // npm run coverage で、テストが通っていない行を見る（しきい値は置かない）
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts', 'src/core/load/testing.ts'],
      reporter: ['text-summary', 'text', 'html']
    }
  }
})
