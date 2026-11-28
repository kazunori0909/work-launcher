import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon'

export interface MenuOption<T extends string> {
  value: T
  label: string
  icon?: string
  /** 選択肢の言語（言語名をその言語で書くとき） */
  lang?: string
}

interface Props<T extends string> {
  /** 押す前から見える中身（いまの値）。label を省くとアイコンだけ */
  icon: string
  label?: React.ReactNode
  /** 読み上げとツールチップ（「表示の言語: 日本語」など） */
  title: string
  options: readonly MenuOption<T>[]
  value: T
  onChange: (value: T) => void
}

/**
 * ヘッダーの右端の切り替え（言語・テーマ）。いまの値と ▾ を出し、押すと選択肢の一覧を出す。
 * 外を押す・Esc・選ぶで閉じる
 */
export function MenuSwitch<T extends string>({
  icon,
  label,
  title,
  options,
  value,
  onChange
}: Props<T>): React.JSX.Element {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent): void => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="menu-switch" ref={ref}>
      <button
        className="menu-switch-button"
        title={title}
        aria-label={title}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Icon name={icon} size={14} />
        {label}
        <Icon name="chevron-down" size={12} />
      </button>
      {open && (
        <div className="menu-switch-list" role="menu">
          {options.map((o) => (
            <button
              key={o.value}
              role="menuitemradio"
              aria-checked={o.value === value}
              lang={o.lang}
              onClick={() => {
                setOpen(false)
                if (o.value !== value) onChange(o.value)
              }}
            >
              <span className="menu-switch-check">
                {o.value === value && <Icon name="check" size={14} />}
              </span>
              {o.icon && <Icon name={o.icon} size={14} />}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
