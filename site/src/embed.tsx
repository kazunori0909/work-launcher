import { lazy, Suspense } from 'react'
import type { ComponentProps } from 'react'
import type * as Embed from '../../src/renderer/src/components/embed'

// アプリの src/renderer/src/components/embed.tsx の代わり（astro.config.mjs で差し替える）。
// md・html の描画（react-markdown・parse5・DOMPurify）は大きいので、埋め込みを出すときにだけ読む

const load = (): Promise<typeof Embed> => import('../../src/renderer/src/components/embed')
const LazyMarkdown = lazy(() => load().then((m) => ({ default: m.Markdown })))
const LazyHtmlEmbed = lazy(() => load().then((m) => ({ default: m.HtmlEmbed })))

export function Markdown(props: ComponentProps<typeof Embed.Markdown>): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyMarkdown {...props} />
    </Suspense>
  )
}

export function HtmlEmbed(props: ComponentProps<typeof Embed.HtmlEmbed>): React.JSX.Element {
  return (
    <Suspense fallback={null}>
      <LazyHtmlEmbed {...props} />
    </Suspense>
  )
}
