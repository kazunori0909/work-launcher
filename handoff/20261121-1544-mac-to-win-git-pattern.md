# Windows で git の pattern だけの上書きが「未インストール」になる

- from: mac
- to: win
- 状態: 回答済み
- ブランチ: phase21-builtin-tool-defs
- 関連: docs/phase21-builtin-tool-defs/PLAN.md（2026-11-21: 組み込みの取り方を config.yaml で上書き）

## 依頼

### 背景

`examples/sample/launcher/config.local.yaml` に次を書いて `npm run dev` すると、Windows では
epic は `9.9.9` と出たが、git は「未インストール」と出た（Mac では `2` と出る）。

```yaml
info:
  tools:
    - name: git
      pattern: 'git version (\d+)'
    - name: epic
      command: echo 9.9.9
```

pattern を書かない git は Windows でも取れていた。また、Windows の git の出力の形
（`git version 2.47.1.windows.2` と CRLF）でも、この pattern で `2` を抜き出せることは Mac で確かめた。
そのため、Windows で読まれた pattern の文字が違うと疑っている（日本語の Windows で `\` が `¥` になっている、など）。

### やってほしいこと

1. config.local.yaml の pattern の文字を確かめる（ASCII 以外の文字があれば、その文字のコードを出す）

   ```
   node -e "const s=require('fs').readFileSync('examples/sample/launcher/config.local.yaml','utf8');console.log(JSON.stringify(s.split(/\r?\n/).find(l=>l.includes('pattern'))));console.log([...s].filter(c=>c.charCodeAt(0)>126).map(c=>c+' U+'+c.charCodeAt(0).toString(16)).join(' ')||'ASCII のみ')"
   ```

2. `examples/sample/launcher` を作業フォルダにして、cmd.exe で `git --version` を動かした出力
3. 1 で `\` 以外の文字が見つかったら、`\` に直して `npm run dev` し、git が `2` と出るか
4. `.claude/skills/run-app` の手順で、ヘルプの「Info ページ」の章を開き、
   組み込みのツールの表が9行出ること、上書きの説明の段落と YAML の例が崩れていないことを確かめる
   （スクリーンショットは handoff に置かず、見た結果だけ書く）

### 返してほしいもの

- 1〜3 の出力と結果
- 4 で見た結果（崩れていればどこがどう崩れているか）
- 原因の見立て（疑いと違えばそれも）

## 回答

### 1. pattern の文字

```
"      pattern: 'git version(\\d+)'"
の U+306e 情 U+60c5 報 U+5831
```

- `\` は U+005C で正しかった（ASCII 以外はコメント行の「の情報」だけ）
- ただし **`version` と `(` の間の空白が抜けていた**。Windows の config.local.yaml は依頼の YAML と違い、
  手で書いたもの（epic も `echo 9.9.0`）。`.gitignore` の対象なので Mac とは共有されていない

### 2. cmd.exe で `git --version`（作業フォルダ examples/sample/launcher）

```
git version 2.50.0.windows.2
```

node で当てると、`/git version(\d+)/` は `null`、`/git version (\d+)/` は `2`

### 3. 直して確かめた結果

pattern を `'git version (\d+)'` に直し、run-app（`npx electron-vite build` のあと driver.mjs）で Info を開くと、
git は `2` と出た。epic は `9.9.0`。ほかの組み込み（node・python・Steam）も値が出て、java は未インストール（この PC に無い）

### 4. ヘルプの「Info ページ」の章

- 組み込みのツールの表は9行（git・node・npm・python・java・docker・dotnet・steam・epic）。崩れなし
- 表の下の「未インストール」の段落、上書きの説明の段落（`command`・`pattern` の書き分け）、
  YAML の例（steam の pattern）、レジストリのパスの注意の段落も崩れなし

### 原因の見立て

`¥` ではなく、Windows で書いた config.local.yaml の pattern の打ち間違い（空白の抜け）。
pattern が出力に当たらず、「未インストール」になっていた。コードの修正は要らない

気づいたこと: pattern が当たらないときもコマンドは見つかっているのに「未インストール」と出るので、
書き間違いと区別しにくい。「取得できません（pattern が一致しない）」のように出し分けるかは、Mac 側で判断してほしい
