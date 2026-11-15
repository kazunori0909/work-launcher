import hljs from 'highlight.js/lib/core'
import css from 'highlight.js/lib/languages/css'
import javascript from 'highlight.js/lib/languages/javascript'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'

// ヘルプのコード見本の色付け。使う言語だけを core に登録する（全言語版は重い）

hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('html', xml)
hljs.registerLanguage('css', css)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('typescript', typescript)

export type CodeLang = 'yaml' | 'html' | 'css' | 'javascript' | 'typescript'

/** 色付けした HTML を返す。中の文字はエスケープ済みなので、そのまま innerHTML に入れてよい */
export function highlight(code: string, lang: CodeLang): string {
  return hljs.highlight(code, { language: lang }).value
}
