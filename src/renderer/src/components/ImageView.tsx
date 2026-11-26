import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { t } from '../../../core/i18n'
import { resolveAsset } from '../../../core/markdown'
import type { Item } from '../../../core/types'
import { Icon } from './Icon'

type ImageItem = Extract<Item, { kind: 'image' }>

/**
 * 画像の項目。width の % はページの幅に対する割合で、項目の間の隙間の分を引く
 * （50% を2つ並べると1行に収まる）。zoom なら押すとウィンドウの中で拡大する
 */
export function ImageView({ item }: { item: ImageItem }): React.JSX.Element {
  const src = resolveAsset(item.path, '')
  // 読めなかった src。パスが変われば（設定の読み直し）また読みにいく
  const [failedSrc, setFailedSrc] = useState<string>()
  const [zoomed, setZoomed] = useState(false)

  if (failedSrc === src) return <div className="item-error">{t().ui.imageMissing(item.path)}</div>
  const img = <img src={src} alt={item.label ?? ''} onError={() => setFailedSrc(src)} />
  const style = widthStyle(item.width)
  const tooltip = item.tooltip ?? (item.zoom ? t().ui.imageZoom : undefined)
  return (
    <>
      {item.zoom ? (
        <button
          type="button"
          className="item-image zoomable"
          style={style}
          data-tooltip={tooltip}
          onClick={() => setZoomed(true)}
        >
          {img}
        </button>
      ) : (
        <div className="item-image" style={style} data-tooltip={tooltip}>
          {img}
        </div>
      )}
      {zoomed && <Lightbox src={src} alt={item.label ?? ''} onClose={() => setZoomed(false)} />}
    </>
  )
}

function widthStyle(width: string | undefined): CSSProperties | undefined {
  if (width === undefined) return undefined
  if (!width.endsWith('%')) return { width }
  return { '--image-percent': parseFloat(width) } as CSSProperties
}

/** ウィンドウの中に画像を大きく出す。閉じるボタン・Esc・背景か画像を押すと閉じる */
function Lightbox({
  src,
  alt,
  onClose
}: {
  src: string
  alt: string
  onClose(): void
}): React.JSX.Element {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" onClick={onClose}>
      <img src={src} alt={alt} />
      <button
        type="button"
        className="lightbox-close"
        aria-label={t().ui.imageClose}
        data-tooltip={t().ui.imageClose}
        onClick={onClose}
      >
        <Icon name="x" size={20} />
      </button>
    </div>,
    document.body
  )
}
