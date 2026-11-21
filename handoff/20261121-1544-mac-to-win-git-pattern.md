# Windows で git の pattern だけの上書きが「未インストール」になる

- from: mac
- to: win
- 状態: 依頼中
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

（受けた側が書く）
