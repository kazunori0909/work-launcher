// 実行の知らせ（RunEvent）をコンソールの行にする。画面から使うため、node: モジュールに依存させない
import { classifyLine } from './console'
import type { CompiledRule, Level, LineStyle } from './console'
import type { RunEvent } from './ipc'
import type { ExecKind } from './types'

export type NewEntry =
  | { type: 'line'; text: string; style: LineStyle }
  /** text はプロンプト（作業フォルダ）か継続の `>`、command はその行のコマンド */
  | { type: 'prompt'; text: string; command: string }
  | { type: 'start' | 'end' | 'system'; text: string; level: Level }

const MAX_COMMAND_LINES = 10

/** ターミナルのプロンプトの形で、実行を始める作業フォルダを表す */
export function promptFor(kind: ExecKind, cwd: string): string {
  if (kind === 'bat') return `${cwd}>`
  if (kind === 'powershell') return `PS ${cwd}>`
  return `${cwd} $`
}

/** プロンプトの後ろに実行する本文を出す。2行目以降は `>` で続け、長ければ行数だけ添える */
export function promptLines(prompt: string, script: string): NewEntry[] {
  const lines = script.replace(/\s+$/, '').split(/\r?\n/)
  const shown = lines.slice(0, MAX_COMMAND_LINES)
  const entries: NewEntry[] = shown.map((command, i) => ({
    type: 'prompt',
    text: i === 0 ? prompt : '>',
    command
  }))
  if (lines.length > shown.length) {
    entries.push({ type: 'prompt', text: '>', command: `…（全 ${lines.length} 行）` })
  }
  return entries
}

/** アプリからの知らせの行（実行の開始・終了・エラー） */
export const systemEntry = (
  type: 'start' | 'end' | 'system',
  text: string,
  level: Level
): NewEntry => ({ type, text, level })

/** コンソールを開く行か。コンソールは実行の開始とエラーのときだけ開く */
export function opensConsole(entry: NewEntry): boolean {
  if (entry.type === 'line' || entry.type === 'prompt') return false
  return entry.type === 'start' || entry.level === 'error'
}

/** 実行の知らせから、コンソールに足す行 */
export function runEventEntries(event: RunEvent, rules: CompiledRule[]): NewEntry[] {
  const line = (text: string): NewEntry => ({
    type: 'line',
    text,
    style: classifyLine(text, rules)
  })
  switch (event.type) {
    case 'message':
      return event.level === 'error'
        ? [systemEntry('system', event.text, 'error')]
        : [line(event.text)]
    case 'output':
      return event.lines.map(line)
    case 'start':
      return [
        systemEntry('start', `▶ ${event.label}`, 'info'),
        ...promptLines(promptFor(event.kind, event.cwd), event.script)
      ]
    case 'exit':
      return [exitEntry(event)]
  }
}

function exitEntry(event: Extract<RunEvent, { type: 'exit' }>): NewEntry {
  const { label } = event
  if (event.error) return systemEntry('end', `■ ${label}: ${event.error}`, 'error')
  if (event.code === 0) return systemEntry('end', `■ ${label} 終了（コード 0）`, 'success')
  if (event.code === null) return systemEntry('end', `■ ${label} 停止しました`, 'warn')
  return systemEntry('end', `■ ${label} 失敗（コード ${event.code}）`, 'error')
}
