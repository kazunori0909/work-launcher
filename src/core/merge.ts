import type { InfoConfig, Item, Page, Project } from './types'

/** config.local.yaml を config.yaml に重ねる（規則は docs/config.md 5章） */
export function mergeProject(base: Project, local?: Project): Project {
  const pages = base.pages.map(withoutReplace)
  if (!local) return { ...base, pages, info: mergeInfo(base.info) }
  for (const { replace, ...lp } of local.pages) {
    const i = pages.findIndex((p) => p.id === lp.id)
    if (i < 0) {
      pages.push(lp)
      continue
    }
    const bp = pages[i]
    pages[i] = {
      id: bp.id,
      title: lp.title ?? bp.title,
      icon: lp.icon ?? bp.icon,
      cwd: lp.cwd ?? bp.cwd,
      items: replace ? lp.items : mergeItems(bp.items, lp.items)
    }
  }
  return {
    title: local.title ?? base.title,
    cwd: local.cwd ?? base.cwd,
    styles: [...base.styles, ...local.styles],
    scripts: [...new Set([...base.scripts, ...local.scripts])],
    openSchemes: local.openSchemes ?? base.openSchemes,
    pages,
    info: mergeInfo(base.info, local.info)
  }
}

function withoutReplace(page: Page): Page {
  const copy = { ...page }
  delete copy.replace
  return copy
}

/** 同じ id の項目を同じ位置で置き換える（グループ・ボタングループの中も探す）。無ければ最後に足す */
function mergeItems(base: Item[], local: Item[]): Item[] {
  let items = base
  for (const item of local) {
    const replaced = item.id === undefined ? undefined : replaceById(items, item)
    items = replaced ?? [...items, item]
  }
  return items
}

/** id が同じ項目を置き換えた新しい並び。見つからなければ undefined */
function replaceById(items: Item[], item: Item): Item[] | undefined {
  for (let i = 0; i < items.length; i++) {
    const cur = items[i]
    if (cur.id === item.id) return items.with(i, item)
    if ('items' in cur) {
      const inner = replaceById(cur.items, item)
      if (inner) return items.with(i, { ...cur, items: inner })
    }
  }
  return undefined
}

/** hidden のツールは同じ名前のものを上書きしたうえで除く */
function mergeInfo(base: InfoConfig, local?: InfoConfig): InfoConfig {
  if (!local) return { ...base, tools: base.tools.filter((t) => !t.hidden) }
  const tools = [...base.tools]
  for (const tool of local.tools) {
    const i = tools.findIndex((t) => t.name === tool.name)
    if (i < 0) tools.push(tool)
    else tools[i] = tool
  }
  // 同じパスはローカルの名前で上書きする
  const registry = [...base.registry]
  for (const r of local.registry) {
    const i = registry.findIndex((b) => b.path === r.path)
    if (i < 0) registry.push(r)
    else registry[i] = r
  }
  return {
    drives: local.drives ?? base.drives,
    env: [...new Set([...base.env, ...local.env])],
    tools: tools.filter((t) => !t.hidden),
    registry
  }
}
