import { createElement } from 'react'
import { findIcon } from '../lib/icons'

export function Icon({
  name,
  size = 16
}: {
  name?: string
  size?: number
}): React.JSX.Element | null {
  const found = name ? findIcon(name) : undefined
  return found ? createElement(found, { size, 'aria-hidden': true, className: 'icon' }) : null
}
