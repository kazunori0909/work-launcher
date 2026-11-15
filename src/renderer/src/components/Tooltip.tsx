import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/** マウスを乗せてから出すまで（OS の title は約1秒かかるため、自前で描く） */
const DELAY_MS = 300
const GAP = 6
const MARGIN = 8

interface Shown {
  text: string
  /** 吹き出しを付ける要素の位置 */
  rect: DOMRect
}

/**
 * `data-tooltip` を持つ要素にマウスを乗せると、少し待って吹き出しを出す。
 * 画面に1つだけ置き、document のマウスの動きを見る
 */
export function Tooltip(): React.JSX.Element | null {
  const [shown, setShown] = useState<Shown>()
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    let target: Element | null = null
    const hide = (): void => {
      clearTimeout(timer)
      target = null
      setShown(undefined)
    }
    const onOver = (e: MouseEvent): void => {
      const el = (e.target as Element | null)?.closest('[data-tooltip]') ?? null
      if (el === target) return
      hide()
      const text = el?.getAttribute('data-tooltip')
      if (!el || !text) return
      target = el
      timer = setTimeout(() => setShown({ text, rect: el.getBoundingClientRect() }), DELAY_MS)
    }
    document.addEventListener('mouseover', onOver)
    document.addEventListener('mousedown', hide)
    document.addEventListener('keydown', hide)
    document.addEventListener('scroll', hide, true)
    window.addEventListener('blur', hide)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseover', onOver)
      document.removeEventListener('mousedown', hide)
      document.removeEventListener('keydown', hide)
      document.removeEventListener('scroll', hide, true)
      window.removeEventListener('blur', hide)
    }
  }, [])

  // 大きさが分かってから位置を決める（描く前に DOM へ直接書く）。下に出し、はみ出すなら上。左右は画面内に収める
  useLayoutEffect(() => {
    const el = box.current
    if (!shown || !el) return
    const { width, height } = el.getBoundingClientRect()
    const { rect } = shown
    const left = Math.min(
      Math.max(MARGIN, rect.left + rect.width / 2 - width / 2),
      window.innerWidth - width - MARGIN
    )
    const below = rect.bottom + GAP
    const top = below + height > window.innerHeight - MARGIN ? rect.top - GAP - height : below
    el.style.left = `${left}px`
    el.style.top = `${top}px`
  }, [shown])

  if (!shown) return null
  return (
    <div ref={box} className="tooltip" role="tooltip">
      {shown.text}
    </div>
  )
}
