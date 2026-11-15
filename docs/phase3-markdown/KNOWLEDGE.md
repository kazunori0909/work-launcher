# Phase 3 で確かめた挙動・制約

## CSP のログ

- 埋め込みの `html` に `onerror` などのイベント属性があると、DevTools に
  「Executing inline event handler violates the following Content Security Policy directive」が出る。
  Chromium は `DOMParser` で解析しただけでも（DOMPurify も内部で使う）この違反を記録する。
  実行はされず、取り除いた後の DOM にもイベント属性は残らない（Electron 45 で確認）

## カスタムプロトコルと CSP

- `wl-file:` の画像は CSP の `img-src` に `wl-file:` を足すと読める。`fetch` は `connect-src`
  （未指定なら `default-src 'self'`）で止まる。画像にしか使わないので足していない
- `protocol.handle` で `net.fetch(file URL)` が失敗すると、画面には `net::ERR_UNEXPECTED` と出る。
  無いファイルは 404 を返すようにした

## YAML

- `- html: <span style="color: red">…</span>` のように値の途中に `: ` があると、
  入れ子のキーと読まれて構文エラーになる（「Nested mappings are not allowed in compact mappings」）。
  `|` の次の行から書けば通る。ヘルプの例のテストで気づいた
