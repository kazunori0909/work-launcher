// utilityProcess で動かす。scripts に並べた JS を読み、指定の関数を ctx を渡して呼ぶ
import path from 'node:path'
import { CTX_ACTIONS, ctxCall } from '../core/ctxCalls'
import type { CtxCall, CtxResult, ExecResult } from '../core/ctxCalls'
// （仕組みは docs/phase2-minimal-app/PLAN.md「function（scripts.js）の動かし方」）

export interface CallRequest {
  /** 読み込む JS（絶対パス）。関数はこの中から名前で探す */
  files: string[]
  fn: string
  /** work.launcher があるフォルダ */
  launcherDir: string
  /** 作業フォルダ（このプロセスの cwd も同じ） */
  workDir: string
  /** select の値（ID → 値） */
  select: Record<string, string>
  /** イベントの関数なら true。関数が無ければ何もせず終える */
  optional?: boolean
  /** change で呼ぶとき、変えた項目 */
  changed?: SelectChange
}

export interface SelectChange {
  id: string
  value: string
  previous: string
}

export type HostMessage =
  | { type: 'log'; text: string; level?: 'error' }
  /** 項目と同じ動作を頼む。結果は同じ id の HostReply で受け取る */
  | { type: 'call'; id: number; call: CtxCall }
  | { type: 'done' }
  | { type: 'error'; message: string }

/** 頼んだ動作の結果（メイン → このプロセス） */
export interface HostReply {
  id: number
  result: CtxResult
}

const post = (message: HostMessage): void => process.parentPort.postMessage(message)
const text = (err: unknown): string => (err instanceof Error ? err.message : String(err))

/** 結果を待っている動作（id → 結果の受け取り） */
const waiting = new Map<number, (result: CtxResult) => void>()
/** 動作が失敗して投げた例外。await していなければ、関数は止めずにコンソールへ出す */
const failures = new WeakSet<Error>()
let nextId = 1

/** 動作を頼む。失敗したら reject する。終わりを待った実行系は終了コードと出力を返す */
function request(call: CtxCall): Promise<ExecResult | void> {
  return new Promise((resolve, reject) => {
    const id = nextId++
    waiting.set(id, (r) => {
      waiting.delete(id)
      if (r.error !== undefined) {
        const err = new Error(r.error)
        failures.add(err)
        reject(err)
      } else if (call.action === 'exec' && call.wait) {
        resolve({
          code: r.code ?? null,
          signal: r.signal ?? null,
          stdout: r.stdout ?? '',
          stderr: r.stderr ?? ''
        })
      } else {
        resolve()
      }
    })
    post({ type: 'call', id, call })
  })
}

/** 頼んだ動作がすべて終わり、await していない失敗をコンソールへ出し終えるまで待つ */
async function settle(): Promise<void> {
  while (waiting.size > 0) await new Promise((r) => setTimeout(r, 20))
  await new Promise((r) => setImmediate(r))
}

process.on('unhandledRejection', (reason) => {
  if (reason instanceof Error && failures.has(reason)) {
    post({ type: 'log', text: reason.message, level: 'error' })
  } else {
    post({ type: 'error', message: text(reason) })
  }
})

process.parentPort.once('message', async (e) => {
  const { files, fn, launcherDir, workDir, select, optional, changed } = e.data as CallRequest
  process.parentPort.on('message', (reply) => {
    const { id, result } = reply.data as HostReply
    waiting.get(id)?.(result)
  })
  try {
    const found = files.flatMap((file) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const mod = require(file)
      const target = mod?.[fn] ?? mod?.default?.[fn]
      return typeof target === 'function' ? [{ file, target }] : []
    })
    const names = (list: string[]): string => list.map((f) => path.basename(f)).join(', ')
    if (found.length === 0 && optional) return post({ type: 'done' })
    if (found.length === 0) throw new Error(`関数 ${fn} がありません（${names(files)}）`)
    if (found.length > 1) {
      throw new Error(`関数 ${fn} が複数のファイルにあります（${names(found.map((f) => f.file))}）`)
    }
    await found[0].target({
      launcherDir,
      workDir,
      env: process.env,
      select,
      ...(changed ? { changed } : {}),
      log: (text: unknown) => post({ type: 'log', text: String(text) }),
      ...Object.fromEntries(
        CTX_ACTIONS.map((name) => [
          name,
          (value: unknown, options?: unknown) => request(ctxCall(name, value, options))
        ])
      )
    })
    await settle()
    post({ type: 'done' })
  } catch (err) {
    post({ type: 'error', message: text(err) })
  }
})
