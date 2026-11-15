# Phase 13 で確かめたこと

## md・html のリンクの href は、3 か所で消される（Mac・2026-11-15）

`openSchemes` に `file` を足しただけでは、md・html の `file:` のリンクは開けなかった。描くまでに次の 3 か所が、
http・https・mailto など以外の URL を消すため。

| どこ                                   | 既定で残すスキーム                                       | 直し方                                   |
| -------------------------------------- | -------------------------------------------------------- | ---------------------------------------- |
| rehype-sanitize（md の生の HTML 含む） | `protocols.href`：http・https・irc・ircs・mailto・xmpp   | `protocols.href` を `openSchemes` にする |
| react-markdown の `urlTransform`       | http・https・irc・ircs・mailto・xmpp（それ以外は空文字） | `urlTransform` を渡す（href だけ）       |
| DOMPurify（html）                      | `ALLOWED_URI_REGEXP`：http(s)・ftp(s)・mailto・tel など  | 正規表現に足し、`a[href]` を後で絞る     |

- 消されたリンクは `href` の無い（または空の）`<a>` になり、押しても何も起きない（エラーも出ない）
- そのため、いままで中クリックで素通しになっていたのは、実際には http・https・mailto と相対リンクだった。
  相対リンクは `file://…/out/renderer/` 起点に解決されていた

## 中クリック（Mac・2026-11-15）

- `onClick` は中クリックでは呼ばれない。`onAuxClick` で `button === 1` を受けて `preventDefault` すると、
  新しいウィンドウ（`setWindowOpenHandler`）に行かない
- Playwright の `page.click(sel, { button: 'middle' })` で、本物の中クリックとして確かめられる（run-app の `mclick`）
