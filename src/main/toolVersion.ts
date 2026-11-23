// Info のツールのバージョンの取り方。Electron に依存させない（scripts/check-tools.mjs からも使う）

import { builtinTool, isUnsupportedTool, toolCommand, toolDisplayName } from '../core/builtinTools'
import { toolResult } from '../core/info'
import type { ToolInfo } from '../core/info'
import type { InfoConfig } from '../core/types'
import { run, runShell } from './exec'

/** Mac の導入を促すスタブで、本体が無いもの（→ BuiltinTool.macStub）。呼ばずに未インストールとする */
async function macStubMissing(name: string): Promise<boolean> {
  const stub = builtinTool(name)?.macStub
  if (!stub) return false
  const which = await runShell(`command -v ${stub.path.split('/').pop()}`, undefined)
  if (which.text.trim() !== stub.path) return false
  const [command, ...args] = stub.check
  return !(await run(command, args)).ok
}

export async function toolInfo(
  t: InfoConfig['tools'][number],
  launcherDir: string | undefined
): Promise<ToolInfo> {
  const name = toolDisplayName(t)
  if (!t.command && isUnsupportedTool(t.name, process.platform)) {
    return { name, unsupported: true }
  }
  const cmd = toolCommand(t, process.platform)
  if (!cmd) return { name }
  if (process.platform === 'darwin' && !t.command && (await macStubMissing(t.name))) {
    return { name }
  }
  // 案件ごとにバージョンを切り替えるツール（mise など）に合わせ、案件フォルダで動かす
  const r = await runShell(cmd.command, launcherDir)
  return { name, ...toolResult(r.ok, r.text, cmd.pattern) }
}
