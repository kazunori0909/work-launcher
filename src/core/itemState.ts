import { selectDefault, selectItems, walkItems } from './items'
import { t } from './i18n'
import type { DisabledItems, Item, ItemWhen, Project } from './types'

// JS の ctx.set・ctx.reset・ctx.enable・ctx.disable と、YAML の reset・enabledWhen・disabledWhen を、
// 案件の項目と照らして状態にする（仕様は docs/config.md 3.2）

export const NO_DISABLED: DisabledItems = { all: false, ids: [] }

/** 押せる・押せないを変えられる項目（ボタンになるもの・枠・select 系） */
function isOperable(item: Item): boolean {
  switch (item.kind) {
    case 'function':
    case 'excel':
    case 'powerpoint':
    case 'word':
    case 'open':
    case 'exec':
    case 'url':
    case 'reset':
    case 'group':
    case 'buttons':
    case 'select':
      return true
    default:
      return false
  }
}

/** 指定の ID の誤り。無い ID・押せる項目でない ID があれば、その理由 */
function checkIds(project: Project, ids: string[]): string | undefined {
  const items = project.pages.flatMap((page) => walkItems(page.items))
  for (const id of ids) {
    const found = items.filter((item) => item.id === id)
    if (found.length === 0) return t().ctx.unknownId(id)
    if (!found.some(isOperable)) return t().ctx.notOperable(id)
  }
  return undefined
}

/**
 * 押せない項目を変える。ids を省くと「全部」だけを切り替え、ID で押せなくした分はそのまま保つ
 * （処理の間だけ全部を止めて、終わったら元の状態に戻せるように）。
 * 全部を押せなくしている間は、ID を押せるようにしても、全部を戻すまでは押せない
 */
export function changeDisabled(
  project: Project,
  current: DisabledItems,
  ids: string[] | undefined,
  enabled: boolean
): { disabled: DisabledItems } | { error: string } {
  if (ids === undefined) return { disabled: { ...current, all: !enabled } }
  const error = checkIds(project, ids)
  if (error) return { error }
  const rest = current.ids.filter((id) => !ids.includes(id))
  return { disabled: { all: current.all, ids: enabled ? rest : [...rest, ...ids] } }
}

/** ctx.set の値を、select の選択肢の値にする。checkbox は true / false でも書ける */
export function selectValue(
  project: Project,
  id: string,
  value: string | boolean
): { value: string; remember: boolean } | { error: string } {
  const item = selectItems(project).get(id)
  if (!item) return { error: t().ctx.noSelect(id) }
  if (typeof value === 'boolean') {
    if (item.control !== 'checkbox') return { error: t().ctx.booleanForCheckbox }
    const [on, off] = item.options
    return { value: (value ? on : off).value, remember: item.remember }
  }
  const values = item.options.map((o) => o.value)
  if (!values.includes(value)) return { error: t().ctx.notOption(id, value, values) }
  return { value, remember: item.remember }
}

/** reset で戻す select の ID。ids を省くと全部。group・buttons の ID なら、中の select・radio・checkbox */
function resetNames(project: Project, ids: string[] | undefined): string[] | { error: string } {
  const selects = selectItems(project)
  if (ids === undefined) return [...selects.keys()]
  const items = project.pages.flatMap((page) => walkItems(page.items))
  const names: string[] = []
  for (const id of ids) {
    if (selects.has(id)) {
      names.push(id)
      continue
    }
    const found = items.filter((item) => item.id === id)
    if (found.length === 0) return { error: t().ctx.unknownId(id) }
    const inside = found
      .flatMap((item) => ('items' in item ? walkItems(item.items) : []))
      .flatMap((item) => (item.kind === 'select' ? [item.name] : []))
    if (inside.length === 0) return { error: t().ctx.noSelectIn(id) }
    names.push(...inside)
  }
  return [...new Set(names)]
}

/** ctx.reset・reset の項目で戻す select と、その初期値（default、無ければ最初の選択肢。checkbox はオフ） */
export function resetValues(
  project: Project,
  ids: string[] | undefined
): { select: Record<string, string>; remember: string[] } | { error: string } {
  const names = resetNames(project, ids)
  if ('error' in names) return names
  const selects = selectItems(project)
  const select: Record<string, string> = {}
  const remember: string[] = []
  for (const name of names) {
    const item = selects.get(name)
    if (!item) continue
    select[name] = selectDefault(item)
    if (item.remember) remember.push(name)
  }
  return { select, remember }
}

/**
 * ほかの項目を指す書き方（reset の ID、enabledWhen・disabledWhen の ID と値）を確かめる。
 * 誤りのある項目はエラーの項目にし、checkbox の true / false は on・off の値にする
 */
export function checkItemRefs(project: Project): Project {
  const selects = selectItems(project)
  const whenValues = (when: ItemWhen): ItemWhen | string => {
    const values: ItemWhen['values'] = {}
    for (const [id, list] of Object.entries(when.values)) {
      const item = selects.get(id)
      if (!item) return t().ctx.noSelect(id)
      const options = item.options.map((o) => o.value)
      values[id] = []
      for (const v of list) {
        let value: string
        if (typeof v === 'boolean' && item.control === 'checkbox') {
          value = (v ? item.options[0] : item.options[1]).value
        } else {
          value = String(v)
        }
        if (!options.includes(value)) return t().ctx.notOption(id, value, options)
        values[id].push(value)
      }
    }
    return { ...when, values }
  }
  const check = (item: Item): Item => {
    if (item.kind === 'reset') {
      const r = resetNames(project, item.ids)
      if ('error' in r) return { kind: 'error', id: item.id, message: `reset: ${r.error}` }
    }
    let next = item
    if ('when' in item && item.when) {
      const when = whenValues(item.when)
      const name = item.when.enabled ? 'enabledWhen' : 'disabledWhen'
      if (typeof when === 'string')
        return { kind: 'error', id: item.id, message: `${name}: ${when}` }
      next = { ...item, when } as Item
    }
    return 'items' in next ? ({ ...next, items: next.items.map(check) } as Item) : next
  }
  return {
    ...project,
    pages: project.pages.map((page) => ({ ...page, items: page.items.map(check) }))
  }
}

/** enabledWhen・disabledWhen で押せないか（values は select のいまの値） */
function whenDisabled(item: Item, values: Record<string, string>): boolean {
  const when = 'when' in item ? item.when : undefined
  if (!when) return false
  const matched = Object.entries(when.values).every(([id, list]) =>
    list.some((v) => String(v) === values[id])
  )
  return when.enabled ? !matched : matched
}

/** その項目を画面で押せないか（枠の中の項目は、枠が押せないかも画面で見る） */
export function isDisabled(
  disabled: DisabledItems,
  values: Record<string, string>,
  item: Item
): boolean {
  return (
    disabled.all ||
    (item.id !== undefined && disabled.ids.includes(item.id)) ||
    whenDisabled(item, values)
  )
}
