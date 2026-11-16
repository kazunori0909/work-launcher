import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import css from 'highlight.js/lib/languages/css'
import dos from 'highlight.js/lib/languages/dos'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import powershell from 'highlight.js/lib/languages/powershell'
import shell from 'highlight.js/lib/languages/shell'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'

// コードの色付け（ヘルプの見本と、設定の md のコードブロック）。使う言語だけを core に登録する（全言語版は重い）。
// 別名（yml・js・ts・sh・ps1・bat など）は各言語の定義に入っている

hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', shell)
hljs.registerLanguage('powershell', powershell)
hljs.registerLanguage('dos', dos)

/** ヘルプの見本で使う言語 */
export type CodeLang = 'yaml' | 'html' | 'css' | 'javascript' | 'typescript'

/** 色付けした HTML を返す。中の文字はエスケープ済みなので、そのまま innerHTML に入れてよい */
export function highlight(code: string, lang: CodeLang): string {
  return hljs.highlight(code, { language: lang }).value
}

/**
 * md のコードブロックの言語名（別名も可）で色付けする。登録していない言語なら undefined。
 * 返す HTML はエスケープ済み
 */
export function highlightMd(code: string, lang: string): string | undefined {
  if (!hljs.getLanguage(lang)) return undefined
  return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value
}
