import { useContext, useId } from 'react'
import {
  defaultIcon,
  execKindFor,
  expandSelect,
  pathKey,
  itemLabel,
  selectDefault
} from '../../../core/items'
import { isDisabled } from '../../../core/itemState'
import { dirOf } from '../../../core/markdown'
import { assertNever } from '../../../core/types'
import type { Item, Page } from '../../../core/types'
import { DisabledContext } from './disabledContext'
import { HtmlEmbed, Markdown } from './embed'
import { EmbedContext } from './embedContext'
import { Alert } from './Alert'
import { Icon } from './Icon'
import { ImageView } from './ImageView'
import { SelectContext } from './selectContext'
import { t } from '../../../core/i18n'

interface Props {
  page: Page
  platform: string
  /** 実行中の項目の位置（pathKey） */
  running: Set<string>
  onActivate(path: number[]): void
}

export function PageView({ page, platform, running, onActivate }: Props): React.JSX.Element {
  return (
    <ItemList items={page.items} platform={platform} running={running} onActivate={onActivate} />
  )
}

interface ListProps {
  items: Item[]
  platform: string
  running: Set<string>
  onActivate(path: number[]): void
  /** 親の位置の並び */
  parent?: number[]
}

/** 項目を横に並べる（ページ・グループの中身） */
export function ItemList({
  items,
  platform,
  running,
  onActivate,
  parent = []
}: ListProps): React.JSX.Element {
  return (
    <div className="items">
      {items.map((item, i) => (
        <ItemView
          key={item.id ?? i}
          item={item}
          platform={platform}
          path={[...parent, i]}
          running={running}
          onActivate={onActivate}
        />
      ))}
    </div>
  )
}

interface ItemProps {
  item: Item
  platform: string
  path: number[]
  running: Set<string>
  onActivate(path: number[]): void
}

/** 押せない枠（group・buttons）の中は、全部を押せなくする */
const ALL_DISABLED = { all: true, ids: [] }

/** ctx.disable と enabledWhen・disabledWhen を合わせて、その項目を押せないか */
function useDisabled(item: Item): boolean {
  return isDisabled(useContext(DisabledContext), useContext(SelectContext).values, item)
}

export function ItemView(props: ItemProps): React.JSX.Element {
  const { item } = props
  const disabled = useDisabled(item)
  const view = <ItemViewInner {...props} />
  if ((item.kind === 'group' || item.kind === 'buttons') && disabled) {
    return <DisabledContext.Provider value={ALL_DISABLED}>{view}</DisabledContext.Provider>
  }
  return view
}

function ItemViewInner(props: ItemProps): React.JSX.Element {
  const { item, platform, path, running, onActivate } = props
  switch (item.kind) {
    case 'break':
      return <div className="item-break" />
    case 'heading':
      return <div className="item-heading">{item.text}</div>
    case 'error':
      return <div className="item-error">{item.message}</div>
    case 'image':
      return <ImageView item={item} />
    case 'alert':
      return (
        <div className="item-alert">
          <Alert kind={item.level}>
            <div className="wl-alert-text">{item.text}</div>
          </Alert>
        </div>
      )
    case 'markdown':
      return (
        <div className="item-embed">
          <Markdown text={item.content} baseDir="" />
        </div>
      )
    case 'html':
      return (
        <div className="item-embed">
          <HtmlEmbed html={item.content} baseDir="" />
        </div>
      )
    case 'mdfile':
      return <MdfileView path={item.path} />
    case 'group':
      return (
        <fieldset className="item-group">
          {item.title !== undefined && (
            <legend>
              <Icon name={item.icon} />
              {item.title}
            </legend>
          )}
          <ItemList
            items={item.items}
            platform={platform}
            running={running}
            onActivate={onActivate}
            parent={path}
          />
        </fieldset>
      )
    case 'details':
      return (
        <details className={item.frame ? 'item-details framed' : 'item-details'} open={item.open}>
          <summary>
            <Icon name="chevron-right" />
            <Icon name={item.icon} />
            {item.title}
          </summary>
          <div className="item-details-body">
            {item.text !== undefined && <div className="item-details-text">{item.text}</div>}
            {item.items.length > 0 && (
              <ItemList
                items={item.items}
                platform={platform}
                running={running}
                onActivate={onActivate}
                parent={path}
              />
            )}
          </div>
        </details>
      )
    case 'buttons':
      return (
        <div className="item-buttons" role="group">
          {item.items.map((child, i) => (
            <ItemView key={child.id ?? i} {...props} item={child} path={[...path, i]} />
          ))}
        </div>
      )
    case 'select':
      return <SelectView item={item} />
    case 'function':
    case 'excel':
    case 'powerpoint':
    case 'word':
    case 'open':
    case 'exec':
    case 'url':
    case 'reset':
      return <ButtonView {...props} />
    default:
      return assertNever(item)
  }
}

function ButtonView({ item, platform, path, running, onActivate }: ItemProps): React.JSX.Element {
  const select = useContext(SelectContext)
  const disabled = useDisabled(item)
  const unavailable =
    item.kind === 'exec' && !execKindFor(item.scripts, platform)
      ? t().run.notOnThisOsOnly(Object.keys(item.scripts))
      : undefined
  const icon = 'icon' in item ? item.icon : undefined
  const tooltip = 'tooltip' in item ? item.tooltip : undefined
  const confirm = 'confirm' in item ? item.confirm : undefined
  // コンソール・エラーには label が "" でも名前を出すため、itemLabel は既定の名前を返す
  const label = itemLabel(item, platform)
  const iconOnly = 'label' in item && item.label === ''
  return (
    <button
      className={running.has(pathKey(path)) ? 'item running' : 'item'}
      data-tooltip={unavailable ?? tooltip ?? (iconOnly ? label : undefined)}
      aria-label={iconOnly ? label : undefined}
      disabled={!!unavailable || disabled}
      onClick={() => {
        if (confirm && !window.confirm(expandSelect(confirm, select.values).value)) return
        onActivate(path)
      }}
    >
      <Icon name={icon ?? defaultIcon(item)} />
      {!iconOnly && label}
    </button>
  )
}

function SelectView({ item }: { item: Extract<Item, { kind: 'select' }> }): React.JSX.Element {
  const { values, onChange } = useContext(SelectContext)
  const disabled = useDisabled(item)
  // 同じ ID の radio を2か所に置いても、ブラウザが互いのチェックを外さないように名前を分ける
  const radioName = useId()
  const value = values[item.name] ?? selectDefault(item)
  const change = (v: string): void => onChange(item, v)

  if (item.control === 'checkbox') {
    const [on, off] = item.options
    return (
      <label className="item-select item-checkbox" data-tooltip={item.tooltip}>
        <input
          type="checkbox"
          disabled={disabled}
          checked={value === on.value}
          onChange={(e) => change(e.target.checked ? on.value : off.value)}
        />
        {item.label ?? item.name}
      </label>
    )
  }
  if (item.control === 'radio') {
    return (
      <div
        className="item-select item-radio"
        role="radiogroup"
        aria-label={item.label}
        data-tooltip={item.tooltip}
      >
        {item.label && <span className="item-select-label">{item.label}</span>}
        {item.options.map((o) => (
          <label key={o.value}>
            <input
              type="radio"
              disabled={disabled}
              name={radioName}
              value={o.value}
              checked={value === o.value}
              onChange={() => change(o.value)}
            />
            {o.label}
          </label>
        ))}
      </div>
    )
  }
  return (
    <label className="item-select" data-tooltip={item.tooltip}>
      {item.label && <span className="item-select-label">{item.label}</span>}
      <select value={value} disabled={disabled} onChange={(e) => change(e.target.value)}>
        {item.options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  )
}

function MdfileView({ path }: { path: string }): React.JSX.Element {
  const file = useContext(EmbedContext).mdfiles[path]
  if (file?.text === undefined) {
    return <div className="item-error">{t().load.mdMissing(path)}</div>
  }
  // 案件フォルダの外の md は、相対リンク・画像を launcherDir 起点で解決する
  return (
    <div className="item-embed">
      <Markdown text={file.text} baseDir={file.path ? dirOf(file.path) : ''} />
    </div>
  )
}
