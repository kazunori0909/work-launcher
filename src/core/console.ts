// 画面とメインの両方から使うため、node: モジュールに依存させない（仕様は docs/config.md 6章）

export const LEVELS = ['error', 'warn', 'info', 'success', 'debug'] as const
export type Level = (typeof LEVELS)[number]

export interface ConsoleRule {
  pattern: string
  flags?: string
  level: Level
  color?: string
}

export interface CompiledRule {
  re: RegExp
  level: Level
  color?: string
}

export interface LineStyle {
  level: Level
  color?: string
}

/** g・y は lastIndex を持ち越して照合がずれるため外す */
export function compileRule(rule: ConsoleRule): CompiledRule {
  const flags = (rule.flags ?? '').replace(/[gy]/g, '')
  return { re: new RegExp(rule.pattern, flags), level: rule.level, color: rule.color }
}

export function classifyLine(line: string, rules: CompiledRule[]): LineStyle {
  const hit = rules.find((r) => r.re.test(line))
  return hit ? { level: hit.level, color: hit.color } : { level: 'info' }
}
