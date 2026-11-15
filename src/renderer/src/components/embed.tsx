import DOMPurify from 'dompurify'
import { useContext, useMemo } from 'react'
import type { ComponentProps } from 'react'
import ReactMarkdown from 'react-markdown'
import type { Components, ExtraProps } from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { resolveAsset } from '../../../core/markdown'
import { EmbedContext } from './embedContext'

// 埋め込み（markdown・mdfile・html）とマニュアルの描画。
// リンク・画像の相対パスは baseDir（launcherDir からの相対フォルダ）起点で解決する

// md 内の生の HTML は GitHub と同じ規則で危険な部分を取り除く。見た目を整えられるよう class・style は残す。
// 見出しの id（`#見出し` のリンク先）は取り除いた後に振る
const schema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] ?? []), 'className', 'style']
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
  const { onLink } = useContext(EmbedContext)
  const components = useMemo<Components>(
    () => ({
      a: (props: ComponentProps<'a'> & ExtraProps) => (
        <a
          {...domProps(props)}
          onClick={(e) => {
            e.preventDefault()
            if (props.href) onLink(props.href, baseDir)
          }}
        />
      ),
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
      >
        {text}
      </ReactMarkdown>
    </div>
  )
}

/** script・イベント属性・form などを取り除き、画像の相対パスを読める URL にする */
function sanitizeHtml(html: string, baseDir: string): string {
  const fragment = DOMPurify.sanitize(html, {
    RETURN_DOM_FRAGMENT: true,
    // form は送信で画面が移り、style は画面全体に効いてしまうため（見た目は最上位の style で変える）
    FORBID_TAGS: ['form', 'style']
  })
  for (const img of fragment.querySelectorAll('img[src]')) {
    img.setAttribute('src', resolveAsset(img.getAttribute('src')!, baseDir))
  }
  const div = document.createElement('div')
  div.append(fragment)
  return div.innerHTML
}

export function HtmlEmbed({ html, baseDir }: { html: string; baseDir: string }): React.JSX.Element {
  const { onLink } = useContext(EmbedContext)
  const content = useMemo(() => sanitizeHtml(html, baseDir), [html, baseDir])
  return (
    <div
      className="embed-html"
      onClick={(e) => {
        const a = (e.target as Element).closest('a')
        if (!a) return
        e.preventDefault()
        const href = a.getAttribute('href')
        if (href) onLink(href, baseDir)
      }}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
