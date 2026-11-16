# Phase 18 タスク

- [x] 関数 ↔ 本体のやり取りを、結果を返せる形にする（依頼に番号を付け、結果を返す）
- [x] `ctx.url` を足し、`ctx.openUrl` を消す
- [x] `ctx.excel`・`ctx.powerpoint`・`ctx.word` を足す
- [x] `ctx.bat`・`ctx.sh`・`ctx.powershell`・`ctx.python` を足す（終了を待つ・待たない指定）
- [x] ウィンドウを閉じたとき・関数が終わったときの、動かしたプロセスの扱いを決めて実装する
- [x] 実行系に `console: false` と、結果の `stdout`・`stderr` を足す
- [x] ヘルプに「関数から呼び出す」の章を足す
- [x] テストを足す
- [x] `docs/config.md` 3.2 とヘルプ・サンプルの JS を直す
- [x] 実機で確かめる（Mac）
- [ ] 実機で確かめる（Windows。手順は下の「Windows での確認」）

## Windows での確認

Mac では確かめ済み。Windows でしか動かない・挙動が変わる所だけを確かめる。
仕様は `docs/config.md` 3.2、設計は PLAN.md。ブランチ `phase18-ctx-item-actions` を取得してから行う。

### 準備

1. `npm ci` → `npm run typecheck` → `npm run lint` → `npm test` が通ることを確かめる
2. `npx electron-vite build`
3. `examples/sample` をスクラッチパッドにコピーし（リポジトリは書き換えない）、
   コピーの `launcher/scripts/zz-test.js` に下の JS を置く。
   コピーの `launcher/config.yaml` のメインページ、`- function: hello` の下に
   `- function: winTest` と `- function: officeTest` を足す。
   Office の確認用に、コピーの `docs/サンプル 仕様書.xlsx` があることを確かめる

   ```js
   module.exports = {
     async winTest(ctx) {
       // A: bat が動き、終了コード・stdout・stderr が返る。日本語が化けない（cp932）
       const a = await ctx.bat('echo 日本語 %CD%\r\necho err 1>&2\r\nexit /b 3')
       ctx.log(`A ${JSON.stringify(a)}`)
       // B: console: false ならコンソールに出ず、stdout だけ受け取れる
       const b = await ctx.bat('echo hidden', { console: false, cwd: 'launcher' })
       ctx.log(`B ${JSON.stringify(b)}`)
       // C: wait: false なら undefined がすぐ返り、出力はあとからコンソールに出る
       const c = await ctx.bat('ping -n 2 127.0.0.1 >nul & echo background', { wait: false })
       ctx.log(`C ${JSON.stringify(c)}`)
       // D: powershell・python・sh（Git Bash）も同じ形で返る（入っていないものはエラーで可）
       for (const [name, script] of [
         ['powershell', 'Write-Output "ps 日本語"'],
         ['python', 'print("py 日本語")'],
         ['sh', 'echo "sh $PWD"']
       ]) {
         try {
           const r = await ctx[name](script, { console: false })
           ctx.log(`D ${name} ${JSON.stringify(r)}`)
         } catch (e) {
           ctx.log(`D ${name} caught: ${e.message}`)
         }
       }
       // E: ${workDir} の展開と、cwd 省略時は関数の作業フォルダ
       const e = await ctx.bat('cd', { console: false })
       ctx.log(`E cwd=${e.stdout.trim()} workDir=${ctx.workDir}`)
       ctx.log('end')
     },
     async officeTest(ctx) {
       // F: Excel が読み取り専用で開く（タイトルバーに「読み取り専用」）
       await ctx.excel('docs/サンプル 仕様書.xlsx', { readonly: true })
       // G: 無いファイルは例外になり、関数は止まってコンソールにエラーが出る
       await ctx.excel('docs/無いファイル.xlsx')
       ctx.log('ここは出ない')
     }
   }
   ```

### 確かめること

`run-app` のスキルで起動し、`winTest` と `officeTest` を押してコンソールの文字を読む
（`eval document.querySelector('.console')?.innerText`）。スキルは Windows で未確認なので、
動かなければ手で起動してスクリーンショットを撮る。

- [ ] A: `code` が 3、`stdout` に「日本語」とコピーのフォルダ、`stderr` に `err`。コンソールにも同じ出力が化けずに出る
- [ ] B: コンソールに `echo hidden` の実行が出ず、`stdout` が `hidden`
- [ ] C: `C undefined` が先に出て、そのあと `background` と終了の行が出る
- [ ] D: 入っているものは `code` 0 と出力が返り、日本語が化けない。入っていないものは「caught」で理由が出る
- [ ] E: `cwd` と `workDir` が同じフォルダ
- [ ] F: Excel が読み取り専用で開く
- [ ] G: `■ officeTest: 見つかりません: …` が出て、「ここは出ない」は出ない
- [ ] ヘルプの「要素を追加する」に「関数から呼び出す」があり、表示が崩れていない

結果はこの節のチェックに付け、食い違いがあれば KNOWLEDGE.md を作って書く（直せるものは直してよい）

## 共通

- [x] 個人情報チェック（追跡ファイルに実値が混入していないか）
