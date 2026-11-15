import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { thirdPartyLicenses } from './scripts/licenses.mjs'

// アプリに入るライブラリ（3つのビルドで共有し、最後の renderer が書き出す）
const bundled = new Set<string>()

export default defineConfig({
  main: {
    plugins: [thirdPartyLicenses(bundled)],
    build: {
      rollupOptions: {
        // scripts.js を別プロセスで動かすための入口（src/main/scriptCall.ts）
        input: {
          index: resolve('src/main/index.ts'),
          scriptHost: resolve('src/main/scriptHost.ts')
        }
      }
    }
  },
  preload: {
    plugins: [thirdPartyLicenses(bundled)]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), thirdPartyLicenses(bundled, { write: true })]
  }
})
