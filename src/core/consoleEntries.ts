// 実行の知らせ（RunEvent）をコンソールの行にする。画面から使うため、node: モジュールに依存させない
import { classifyLine } from './console'
import type { CompiledRule, Level, LineStyle } from './console'
import type { RunEvent } from './ipc'
import type { ExecKind } from './types'
import { t } from './i18n'

/** runId は exec の実行の行にだけ入る（function の知らせ・アプリのエラーには無い） */
export type NewEntry = { runId?: number } & (
  | { type: 'line'; text: string; style: LineStyle }
  /** text はプロンプト（作業フォルダ）か継続の `>`、command はその行のコマンド */
  | { type: 'prompt'; text: string; command: string }
  | { type: 'start' | 'end' | 'system'; text: string; level: Level }
)

export type ConsoleFilter = 'all' | 'warn' | 'error'

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
    entries.push({ type: 'prompt', text: '>', command: t().console.folded(lines.length) })
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

export function levelOf(entry: NewEntry): Level {
  if (entry.type === 'line') return entry.style.level
  return entry.type === 'prompt' ? 'debug' : entry.level
}

/** 実行の知らせから、コンソールに足す行 */
export function runEventEntries(event: RunEvent, rules: CompiledRule[]): NewEntry[] {
  const line = (text: string, runId?: number): NewEntry => ({
    type: 'line',
    text,
    style: classifyLine(text, rules),
    ...(runId === undefined ? {} : { runId })
  })
  switch (event.type) {
    case 'message':
      return event.level === 'error'
        ? [systemEntry('system', event.text, 'error')]
        : [line(event.text)]
    case 'output':
      return event.lines.map((text) => line(text, event.runId))
    case 'start':
      return [
        systemEntry('start', `▶ ${event.label}`, 'info'),
        ...promptLines(promptFor(event.kind, event.cwd), event.script)
      ].map((e) => ({ ...e, runId: event.runId }))
    case 'exit':
      return [{ ...exitEntry(event), runId: event.runId }]
  }
}

function exitEntry(event: Extract<RunEvent, { type: 'exit' }>): NewEntry {
  const { label } = event
  if (event.error) return systemEntry('end', `■ ${label}: ${event.error}`, 'error')
  if (event.code === 0) return systemEntry('end', t().console.ok(label), 'success')
  if (event.code === null) return systemEntry('end', t().console.stopped(label), 'warn')
  return systemEntry('end', t().console.failed(label, event.code), 'error')
}
