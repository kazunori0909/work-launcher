# Phase 36 HANDOFF（Mac ⇄ Windows）

依頼と回答のやりとり（書き方は /handoff）。新しい依頼は末尾に足す。

## 2026-11-24 22:35 mac → win: 大量の出力でコンソールが止まらないか

- 状態: 依頼中
- 関連: PLAN.md「上限は 3 万行、`content-visibility` は使わない」、KNOWLEDGE.md「大量の出力の重さ」

### 依頼

- 背景:
  - 長いビルド（UE4 など）のように大量に出力するコマンドに向けて、コンソールを作り直した。
    メインは出力を 50ms ごとにまとめて送り、画面は行を React を通さずに DOM に直接足す。残す行は 3 万行（旧は 5000 行）
  - Mac では、10 万行を出して 2.5 秒で終わり、画面が 50ms を超えて止まることは無かった。
    Windows は遅いことがあるので、同じ計測をしてほしい
  - 確かめ用に、`examples/sample` のサンプルのタブに「大量の出力（10 万行）」を足した。
    Windows では bat 版が動き、1000 行ごとに `WARN step N`、その間に `error: sample N` を出す
- やってほしいこと:
  1. ブランチを取ってビルドする

     ```bash
     git fetch
     git switch phase36-console-bulk-output
     npm ci
     npx electron-vite build
     ```

  2. 次の内容を ASCII のまま `measure.txt` として保存し（日本語を避けている。PowerShell のパイプで化けるため）、
     run-app のドライバに流す。2 回流して、`{` で始まる行を返してほしい

     ```text
     wait button.tab
     click button.tab >> nth=1
     sleep 500
     eval new Promise(r=>{const b=[...document.querySelectorAll("button")].find(x=>x.textContent.includes("\u5927\u91cf"));const t0=performance.now();let last=t0,gaps=[],started=false;b.click();const tick=()=>{const n=performance.now();if(n-last>50)gaps.push(Math.round(n-last));last=n;const run=!!document.querySelector(".console-bar .stop");if(run)started=true;if(started&&!run){const body=document.querySelector(".console-body");setTimeout(()=>r(JSON.stringify({ms:Math.round(n-t0),gaps,dom:document.querySelector(".console-lines").childElementCount,counts:document.querySelector(".console-bar").innerText.match(/\d+/g),atBottom:body.scrollHeight-body.scrollTop-body.clientHeight<8})),300)}else if(n-t0>300000)r("timeout");else requestAnimationFrame(tick)};requestAnimationFrame(tick)})
     eval new Promise(r=>{const b=[...document.querySelectorAll("button")].find(x=>x.textContent.includes("\u5927\u91cf"));const t0=performance.now();let up=false,started=false;b.click();const tick=()=>{const n=performance.now();const body=document.querySelector(".console-body");if(!up&&n-t0>800){up=true;body.scrollTop=100}const run=!!document.querySelector(".console-bar .stop");if(run)started=true;if(started&&!run)setTimeout(()=>r(JSON.stringify({scrolledUpThenEnd:Math.round(body.scrollTop)})),300);else if(n-t0>300000)r("timeout");else requestAnimationFrame(tick)};requestAnimationFrame(tick)})
     select .console-bar select error
     sleep 300
     eval JSON.stringify({shownInError:[...document.querySelectorAll(".console-lines > .line")].filter(e=>getComputedStyle(e).display!=="none").length})
     ss filter-error
     select .console-bar select all
     eval new Promise(r=>{const b=[...document.querySelectorAll("button")].find(x=>x.textContent.includes("\u5927\u91cf"));b.click();setTimeout(()=>{const s=document.querySelector(".console-bar .stop");const t0=performance.now();s.click();const tick=()=>{if(!document.querySelector(".console-bar .stop"))r(JSON.stringify({stopMs:Math.round(performance.now()-t0)}));else if(performance.now()-t0>10000)r("stop-timeout");else requestAnimationFrame(tick)};tick()},1500)})
     sleep 500
     ss after-stop
     quit
     sleep 1500
     ```

     ```powershell
     $env:SHOT_DIR = "$env:TEMP\wl-shots"
     Get-Content measure.txt | node .claude/skills/run-app/driver.mjs examples/sample
     ```

  3. 最初の行の `gaps` に 100ms を超える値があれば、`src/renderer/src/hooks/useConsole.ts` の
     `MAX_LINES` を `20_000` にしてビルドし直し、2 をもう一度流す（この変更はコミットしない。終わったら戻す）
  4. 停止の後に、cmd.exe が残っていないかを見る（`Get-Process cmd -ErrorAction SilentlyContinue`）
  5. サンプルの「bat」ボタン（日本語を出す）を押し、コンソールで文字化けしないかをスクリーンショットで見る
- 返してほしいもの:
  - 2 の `{` で始まる行（各 2 回）。3 をやったなら、その結果も
  - スクリーンショット `filter-error.png`・`after-stop.png`・5 のものを見た所見
    （エラーのみで error の行と実行の開始・終了だけが出ているか、停止の行が出ているか、文字化けが無いか）
  - 4 の結果と、PC の CPU（分かれば）

### 回答

（受けた側が書く）
