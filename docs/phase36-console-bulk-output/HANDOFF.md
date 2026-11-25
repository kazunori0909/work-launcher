# Phase 36 HANDOFF（Mac ⇄ Windows）

依頼と回答のやりとり（書き方は /handoff）。新しい依頼は末尾に足す。

## 2026-11-24 22:35 mac → win: 大量の出力でコンソールが止まらないか

- 状態: 回答済み
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

2026-11-25 win（Intel Core i7-10750H 2.60GHz・6コア12スレッド、Windows 11 Home）。手順 1 のとおりビルドし、`measure.txt` を 2 回流した。

#### 2 の結果

| 項目              | 1 回目 | 2 回目 |
| ----------------- | ------ | ------ |
| ms                | 9374   | 9503   |
| gaps の最大       | 85     | 87     |
| dom               | 27622  | 29247  |
| atBottom          | false  | false  |
| scrolledUpThenEnd | 100    | 100    |
| shownInError      | 30     | 30     |
| stopMs            | 292    | 259    |

```text
{"ms":9374,"gaps":[76,74,85,76,55,76,77,54,55,76,73,75,77,55,76,74,52,73,74,75,78,57],"dom":27622,"counts":["28","28"],"atBottom":false}
{"scrolledUpThenEnd":100}
{"shownInError":30}
{"stopMs":292}

{"ms":9503,"gaps":[84,52,54,52,53,54,54,60,52,52,52,53,87,50,53,69,52,52],"dom":29247,"counts":["29","30"],"atBottom":false}
{"scrolledUpThenEnd":100}
{"shownInError":30}
{"stopMs":259}
```

- 10 万行は約 9.4 秒で終わった（Mac の約 4 倍）。50ms を超えた止まりは 18〜22 回あり、最大は 87ms
- `gaps` に 100ms を超える値が無かったので、手順 3（`MAX_LINES` を 2 万行にする）はやっていない

#### 気になった点: 末尾への追従が外れる

- **1 回目の実行（スクロールを一切触っていない）で `atBottom` が false**。2 回とも同じ
- 別に流して位置を見ると、終了時に `scrollHeight 539364 / scrollTop 485774 / clientHeight 238` で、
  末尾から約 5.3 万 px 上に止まっていた。最後の行（`WARN step 100000`・`done`・`■ … 終了（コード 0）`）は DOM にはあるが画面に出ていない
- 原因は見ていないが、次を疑っている（コードは直していない）
  - 3 万行を超えて先頭の行を消したときに `scrollTop` が下がり、その `scroll` の知らせで
    `following()` が false になって `autoTop` が `Infinity` になる（`Console.tsx` の `onScroll`）
  - または、追従の effect が `[lines, counts, filter]` でしか走らず、`counts`（エラー・警告の数）が変わらない間の行には追従しない
- このため、後の実行の画面にも前の位置が残る（下の after-stop・bat の所見）

#### スクリーンショットの所見

- `filter-error.png`: `error: sample 76500` などの error の行だけが出ている。
  エラーのみで出ている 30 行の中身は、error の行 29 行と `■ 大量の出力（10 万行） 終了（コード 0）` の 1 行。
  **開始の行（`▶ 大量の出力…`）は出ていない**。3 万行の上限で先頭から消されているため
- `after-stop.png`: 画面には前の実行の行（`[89788] compiling Module.cpp` あたり）が出ていて、停止の行は画面に映っていない（追従が外れているため）。
  DOM の最後の行は `■ 大量の出力（10 万行） 失敗（コード 1）` で、停止を表す専用の行は無く「失敗（コード 1）」として出る
- 5 の bat: 長い出力の後に押すと、追従が外れていて画面に出なかった。アプリを起動し直して bat だけを押すと、
  `こんにちは、bat です（2026/11/25 13:20:14.96）` と `■ bat 終了（コード 0）` が化けずに出た

#### 4 の結果

停止の後に `Get-Process cmd` で残っていたのは Claude Code 自身のシェルの cmd.exe（親が claude.exe）だけで、アプリ由来の cmd.exe は残っていなかった

#### 追記（2026-11-25 win）: 遅さの切り分け

Windows の 9.4 秒が表示側のせいかを確かめるため、同じ 10 万行で比べた。

| 条件                          | かかった時間    |
| ----------------------------- | --------------- |
| bat 単体、出力を nul に捨てる | 約 7.6 秒       |
| bat 単体、パイプで受ける      | 約 7.9 秒       |
| アプリで bat（上の計測）      | 約 9.4 秒       |
| node で出力を作るだけ         | 約 0.1 秒       |
| アプリで node の出力を受ける  | 約 0.7〜0.85 秒 |

- 遅さの大半は cmd.exe の `for /l` と `echo`（出力を捨てても 7.6 秒）。表示側がボトルネックになっているのではない
- node の出力は、`examples/sample` をコピーして bat 版を次のスクリプトに差し替えて測った（1000 行ずつ `process.stdout.write` する）。
  結果は `{"ms":850,"gaps":[300,364],"dom":27001,"counts":["27","27"],"atBottom":true}` と
  `{"ms":721,"gaps":[268,253],"dom":27001,"counts":["27","27"],"atBottom":true}`

表示側で手当てが要りそうな点（コードは直していない）:

1. **一気に流れてくると、画面が 250〜360ms 止まる。** 50ms を超えた止まりは 2 回だけだが、1 回が長い。
   まとめて送る 1 回分が大きくなり、それを一度に DOM に足しているためと思われる。
   1 回に足す行数に上限を付けて何フレームかに分けるなど、手当てが要りそう
2. **末尾への追従は、少しずつ出るときだけ外れる。** node で一気に出したときは `atBottom: true` だった。
   少しずつ出る間に先頭の行が何度も消され、そのときの `scroll` の知らせで `following()` が false になる、という上の見立てに合う
