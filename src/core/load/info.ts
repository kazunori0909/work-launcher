import { builtinTool } from '../builtinTools'
import { parseRegistryPath, registryDefaultName } from '../info'
import type { InfoConfig, InfoRegistry, InfoTool } from '../types'
import { isObj } from './reader'
import type { Reader } from './reader'
import { t } from '../i18n'

// 設定の info（Info ページに出すもの）の読み方

export function readInfo(r: Reader, raw: unknown, file: string): InfoConfig {
  const info: InfoConfig = { env: [], tools: [], registry: [] }
  if (raw === undefined) return info
  if (!isObj(raw)) {
    r.error(file, t().load.infoNotMap)
    return info
  }
  r.warnUnknown(raw, ['drives', 'env', 'tools', 'registry'], file, 'info')
  if (typeof raw.drives === 'boolean') info.drives = raw.drives
  for (const e of r.list(raw.env, file, 'info.env')) {
    if (typeof e === 'string') info.env.push(e)
    else r.error(file, t().load.infoEnv)
  }
  for (const t of r.list(raw.tools, file, 'info.tools')) {
    const tool = readTool(r, t, file)
    if (tool) info.tools.push(tool)
  }
  for (const entry of r.list(raw.registry, file, 'info.registry')) {
    const registry = readRegistry(r, entry, file)
    if (registry) info.registry.push(registry)
  }
  return info
}

function readRegistry(r: Reader, raw: unknown, file: string): InfoRegistry | undefined {
  const p = typeof raw === 'string' ? raw : isObj(raw) ? raw.path : undefined
  if (typeof p !== 'string') {
    r.error(file, t().load.infoRegistry)
    return undefined
  }
  if (!parseRegistryPath(p)) {
    r.error(file, t().load.registryRoot(p))
    return undefined
  }
  const name = isObj(raw) ? r.str(raw, 'name', file) : undefined
  return { name: name ?? registryDefaultName(p), path: p }
}

function readTool(r: Reader, raw: unknown, file: string): InfoTool | undefined {
  const tool: InfoTool | undefined =
    typeof raw === 'string'
      ? { name: raw }
      : isObj(raw) && typeof raw.name === 'string'
        ? {
            name: raw.name,
            command: r.str(raw, 'command', file),
            pattern: r.str(raw, 'pattern', file),
            ...(raw.hidden === true && { hidden: true })
          }
        : undefined
  if (!tool) {
    r.error(file, t().load.infoTools)
    return undefined
  }
  if (!tool.hidden && !tool.command && !builtinTool(tool.name)) {
    r.error(file, t().load.toolNeedsCommand(tool.name))
    return undefined
  }
  return tool
}
