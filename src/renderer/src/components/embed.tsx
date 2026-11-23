import DOMPurify from 'dompurify'
import { useCallback, useContext, useMemo, useSyncExternalStore } from 'react'
import type { ComponentProps } from 'react'
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import type { Components, ExtraProps } from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { resolveAsset } from '../../../core/markdown'
import { FORBIDDEN_SCHEMES, hrefAllowed } from '../../../core/schemes'
import { EmbedContext } from './embedContext'
import { highlightMd } from '../lib/highlight'

// 埋め込み（markdown・mdfile・html）とマニュアルの描画。
// リンク・画像の相対パスは baseDir（launcherDir からの相対フォルダ）起点で解決する

// md 内の生の HTML は GitHub と同じ規則で危険な部分を取り除く。見た目を整えられるよう class・style は残す。
// リンクは openSchemes のスキームだけ残す。見出しの id（`#見出し` のリンク先）は取り除いた後に振る
function sanitizeSchema(openSchemes: readonly string[]): typeof defaultSchema {
  return {
    ...defaultSchema,
    attributes: {
      ...defaultSchema.attributes,
      '*': [...(defaultSchema.attributes?.['*'] ?? []), 'className', 'style']
    },
    protocols: {
      ...defaultSchema.protocols,
      href: openSchemes.filter((s) => !FORBIDDEN_SCHEMES.includes(s))
    }
  }
}

/** react-markdown が渡す構文木（node）を DOM の属性に混ぜない */
function domProps<T extends { node?: unknown }>(props: T): Omit<T, 'node'> {
  const copy = { ...props }
  delete copy.node
  return copy
}

interface Props {
  text: string
  baseDir: string
}

export function Markdown({ text, baseDir }: Props): React.JSX.Element {
  const { onLink, openSchemes } = useContext(EmbedContext)
  const schema = useMemo(() => sanitizeSchema(openSchemes), [openSchemes])
  // react-markdown も既定で http・https・mailto など以外の URL を空にするため、リンクは openSchemes で決める
  const urlTransform = useCallback(
    (url: string, key: string) =>
      key === 'href' ? (hrefAllowed(url, openSchemes) ? url : '') : defaultUrlTransform(url),
    [openSchemes]
  )
  const components = useMemo<Components>(
    () => ({
      a: (props: ComponentProps<'a'> & ExtraProps) => (
        <a
          {...domProps(props)}
          onClick={(e) => {
            e.preventDefault()
            if (props.href) onLink(props.href, baseDir)
          }}
          onAuxClick={(e) => {
            if (!isMiddle(e)) return
            e.preventDefault()
            if (props.href) onLink(props.href, baseDir)
          }}
        />
      ),
      code: (props: ComponentProps<'code'> & ExtraProps) => {
        const html = codeHtml(props)
        const attrs = domProps(props)
        if (html === undefined) return <code {...attrs} />
        delete attrs.children
        return <code {...attrs} dangerouslySetInnerHTML={{ __html: html }} />
      },
      img: (props: ComponentProps<'img'> & ExtraProps) => (
        <img
          {...domProps(props)}
          src={typeof props.src === 'string' ? resolveAsset(props.src, baseDir) : undefined}
        />
      )
    }),
    [onLink, baseDir]
  )
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, [rehypeSanitize, schema], rehypeSlug]}
        components={components}
        urlTransform={urlTransform}
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

/**
 * 言語を書いたコードブロック（```yaml など。class が language-*）を色付けした HTML。
 * 言語なし・登録していない言語・中身が文字だけでないものは undefined（そのまま出す）
 */
function codeHtml({ className, children }: ComponentProps<'code'>): string | undefined {
  const lang = /(?:^|\s)language-(\S+)/.exec(className ?? '')?.[1]
  if (lang === undefined || typeof children !== 'string') return undefined
  return highlightMd(children, lang)
}

/** DOMPurify が既定で残す URL のスキーム（ALLOWED_URI_REGEXP の既定と同じ） */
const PURIFY_SCHEMES = [
  'ftp',
  'ftps',
  'http',
  'https',
  'mailto',
  'tel',
  'callto',
  'sms',
  'cid',
  'xmpp',
  'matrix'
]

/** 既定のスキームに openSchemes を足した ALLOWED_URI_REGEXP（形は DOMPurify の既定に合わせる） */
function uriRegExp(openSchemes: readonly string[]): RegExp {
  const names = [...PURIFY_SCHEMES, ...openSchemes.filter((s) => !FORBIDDEN_SCHEMES.includes(s))]
  // スキーム名は読み込みで [a-z][a-z\d+.-]* に限っているが、正規表現の記号はすべてエスケープしておく
  const list = names.map((s) => s.replace(/[\\^$.*+?()[\]{}|-]/g, '\\$&')).join('|')
  return new RegExp(`^(?:(?:${list}):|[^a-z]|[a-z+.\\-]+(?:[^a-z+.\\-:]|$))`, 'i')
}

/**
 * script・イベント属性・form などを取り除き、画像の相対パスを読める URL にする。
 * リンクの href は openSchemes のスキームだけ残す
 */
function sanitizeHtml(html: string, baseDir: string, openSchemes: readonly string[]): string {
  const fragment = DOMPurify.sanitize(html, {
    RETURN_DOM_FRAGMENT: true,
    // form は送信で画面が移り、style は画面全体に効いてしまうため（見た目は最上位の style で変える）
    FORBID_TAGS: ['form', 'style'],
    ALLOWED_URI_REGEXP: uriRegExp(openSchemes)
  })
  for (const img of fragment.querySelectorAll('img[src]')) {
    img.setAttribute('src', resolveAsset(img.getAttribute('src')!, baseDir))
  }
  for (const a of fragment.querySelectorAll('a[href]')) {
    if (!hrefAllowed(a.getAttribute('href')!, openSchemes)) a.removeAttribute('href')
  }
  const div = document.createElement('div')
  div.append(fragment)
  return div.innerHTML
}

const noSubscribe = (): (() => void) => () => {}
const isClient = (): boolean => true
const isServer = (): boolean => false

export function HtmlEmbed({ html, baseDir }: { html: string; baseDir: string }): React.JSX.Element {
  const { onLink, openSchemes } = useContext(EmbedContext)
  // DOMPurify は DOM が要る。Web サイト（site/）のビルドでは DOM が無いので空で書き出し、
  // ブラウザで hydrate したあとに描く（アプリは createRoot なので最初から描く）
  const hasDom = useSyncExternalStore(noSubscribe, isClient, isServer)
  const content = useMemo(
    () => (hasDom ? sanitizeHtml(html, baseDir, openSchemes) : ''),
    [hasDom, html, baseDir, openSchemes]
  )
  const open = (e: React.MouseEvent): void => {
    const a = (e.target as Element).closest('a')
    if (!a) return
    e.preventDefault()
    const href = a.getAttribute('href')
    if (href) onLink(href, baseDir)
  }
  return (
    <div
      className="embed-html"
      onClick={open}
      onAuxClick={(e) => {
        if (isMiddle(e)) open(e)
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}

/**
 * 中クリック。ブラウザの既定の動き（新しいウィンドウで開く）に任せると openSchemes を通らないため、
 * クリックと同じ処理に回す（メインの setWindowOpenHandler は何も開かずに断る）
 */
function isMiddle(e: React.MouseEvent): boolean {
  return e.button === 1
}
