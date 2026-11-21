import path from 'node:path'
import { LEVELS } from '../console'
import type { ConsoleRule, Level } from '../console'
import type { Diagnostic } from '../types'
import { FatalError, isObj, parseYaml } from './reader'
import type { ReadFile } from './reader'
import { t } from '../i18n'

export const CONSOLE_FILES = ['launcher/console.local.yaml', 'launcher/console.yaml']

/** console.yaml を読む。個人用（console.local.yaml）のルールを先に並べる */
export async function loadConsoleRules(
  launcherDir: string,
  readFile: ReadFile
): Promise<{ rules: ConsoleRule[]; diagnostics: Diagnostic[] }> {
  const rules: ConsoleRule[] = []
  const diagnostics: Diagnostic[] = []
  for (const file of CONSOLE_FILES) {
    const text = await readFile(path.join(launcherDir, file))
    if (text === undefined) continue
    let raw: unknown
    try {
      raw = parseYaml(text, file)
    } catch (e) {
      if (e instanceof FatalError) {
        diagnostics.push(e.diagnostic)
        continue
      }
      throw e
    }
    const list = isObj(raw) ? raw.rules : undefined
    if (!Array.isArray(list)) {
      diagnostics.push({ level: 'error', file, message: t().load.rulesNotList })
      continue
    }
    for (const r of list) {
      const rule = consoleRule(r)
      if (typeof rule === 'string') diagnostics.push({ level: 'error', file, message: rule })
      else rules.push(rule)
    }
  }
  return { rules, diagnostics }
}

/** 正しければルール、誤りがあればその説明を返す */
function consoleRule(raw: unknown): ConsoleRule | string {
  if (!isObj(raw) || typeof raw.pattern !== 'string') return t().load.ruleNoPattern
  const { pattern, flags, level = 'info', color } = raw
  if (flags !== undefined && typeof flags !== 'string') return t().load.ruleFlags(pattern)
  if (!(LEVELS as readonly unknown[]).includes(level)) {
    return t().load.ruleLevel([...LEVELS], pattern)
  }
  if (color !== undefined && typeof color !== 'string') return t().load.ruleColor(pattern)
  try {
    new RegExp(pattern, flags)
  } catch {
    return t().load.ruleRegex(pattern)
  }
  return { pattern, flags, level: level as Level, color }
}
