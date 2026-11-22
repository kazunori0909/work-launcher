import { useMemo, useState } from 'react'
import { Icon } from '../components/Icon'
import { useIconNames } from '../icons'
import { t } from '../../../core/i18n'

const MAX_SHOWN = 120

/** 同梱している Lucide のアイコンを名前で探す。押すと `icon: 名前` をコピーする */
export function IconBrowser(): React.JSX.Element {
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState<string>()
  const names = useIconNames()
  const matched = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? names.filter((n) => n.includes(q)) : names
  }, [query, names])

  const copy = async (name: string): Promise<void> => {
    await navigator.clipboard.writeText(`icon: ${name}`)
    setCopied(name)
  }

  return (
    <div className="icon-browser">
      <div className="icon-search">
        <input
          type="search"
          placeholder={t().help.iconSearch}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <span className="muted">
          {t().help.iconCount(matched.length)}
          {matched.length > MAX_SHOWN && t().help.iconShown(MAX_SHOWN)}
          {copied && t().help.iconCopied(copied)}
        </span>
      </div>
      <div className="icon-grid">
        {matched.slice(0, MAX_SHOWN).map((name) => (
          <button
            key={name}
            className="icon-cell"
            title={`icon: ${name}`}
            onClick={() => copy(name)}
          >
            <Icon name={name} size={20} />
            <span>{name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
