# Phase 9 KNOWLEDGE

## Electron: `persist:` の無いパーティションは保存されない

- ウィンドウは `session.fromPartition('window-<N>')` で開いている（md・html の画像のプロトコルをウィンドウごとに登録するため。→ phase8）
- 名前が `persist:` で始まらないパーティションはメモリだけのセッションで、localStorage・IndexedDB・Cookie は
  ウィンドウを閉じると消える。`npm run dev` でも配布したアプリでも同じ
- 画面側に残したいもの（select の記憶など）は、メインがファイルに書く
