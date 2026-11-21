// commit・push する内容に個人情報が入っていないかを確かめる。
//   node scripts/check-personal-info.mjs          … 作業ツリーの変更と、まだ push していないコミットを見る
//   node scripts/check-personal-info.mjs --hook   … Claude Code の PreToolUse から呼ぶ（git commit・push のときだけ見る）
// 照らし合わせる実値（この PC のユーザー名・ホスト名・git のメールアドレス）は実行時に読む。ここには書かない。
// 意図して載せる行は、同じ行に `personal-info:allow` と書けば通す
import { execFileSync } from 'node:child_process'
import { readFileSync, statSync } from 'node:fs'
import os from 'node:os'

const git = (...args) => {
  try {
    return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim()
  } catch {
    return undefined
  }
}

// ---- 何を見るか

const hook = process.argv.includes('--hook')
let scanWork = true
let scanOutgoing = true
if (hook) {
  const input = JSON.parse(readFileSync(0, 'utf8') || '{}')
  if (process.env.CLAUDE_PROJECT_DIR) process.chdir(process.env.CLAUDE_PROJECT_DIR)
  // コマンドの文字列そのものはコミットされないので見ない（コミットメッセージは push の前に見る）
  const command = String(input.tool_input?.command ?? '')
  const ops = [...command.matchAll(/\bgit\s+(?:-C\s+\S+\s+)?(commit|push)\b/g)].map((m) => m[1])
  if (ops.length === 0) process.exit(0)
  scanWork = ops.includes('commit')
  scanOutgoing = ops.includes('push')
}

// ---- 見る文字列を集める（{ where, text }）

const targets = []
const addDiff = (diff, label) => {
  let file = ''
  let line = 0
  for (const l of diff.split('\n')) {
    if (l.startsWith('+++ ')) file = l.slice(6)
    else if (l.startsWith('@@')) line = Number(/\+(\d+)/.exec(l)?.[1] ?? 0)
    else if (l.startsWith('+'))
      targets.push({ where: `${label}${file}:${line++}`, text: l.slice(1) })
  }
}
const SKIP = /(^|\/)package-lock\.json$|\.(png|jpe?g|gif|ico|icns|zip|exe|dmg|woff2?|ttf)$/i

if (scanWork) {
  addDiff(git('diff', 'HEAD', '--unified=0', '--no-color', '--no-ext-diff') ?? '', '')
  for (const f of (git('ls-files', '--others', '--exclude-standard') ?? '').split('\n')) {
    if (!f || SKIP.test(f) || statSync(f).size > 1024 * 1024) continue
    readFileSync(f, 'utf8')
      .split(/\r?\n/)
      .forEach((text, i) => targets.push({ where: `${f}:${i + 1}`, text }))
  }
}
if (scanOutgoing) {
  const base = git('rev-parse', '--verify', '-q', '@{u}')
    ? '@{u}'
    : git('merge-base', 'HEAD', 'origin/main')
  if (base) {
    addDiff(git('diff', `${base}..HEAD`, '--unified=0', '--no-color', '--no-ext-diff') ?? '', '')
    ;(git('log', `${base}..HEAD`, '--format=%B') ?? '')
      .split('\n')
      .forEach((text) => targets.push({ where: 'コミットメッセージ', text }))
  }
}

// ---- 照らし合わせる

const word = (s) =>
  new RegExp(`(?<![A-Za-z0-9])${s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9])`, 'i')
const GENERIC = new Set([
  'user',
  'users',
  'admin',
  'root',
  'runner',
  'localhost',
  'u',
  'me',
  'name',
  'username'
])
const needles = []
const addNeedle = (kind, v) => {
  if (v && v.length >= 3 && !GENERIC.has(v.toLowerCase())) needles.push({ kind, re: word(v) })
}
addNeedle('この PC のユーザー名', os.userInfo().username)
addNeedle('この PC のユーザー名', process.env.USERNAME)
addNeedle('ホスト名', os.hostname().split('.')[0])

// ホームのパス（ダミーの名前は通す）
const HOME = /(?:\/Users\/|\/home\/|[A-Za-z]:[\\/]+Users[\\/]+)([A-Za-z0-9][^\\/\s'"`<>%$]*)/gi
const DUMMY_HOME = new Set([
  ...GENERIC,
  'public',
  'default',
  'shared',
  'someone',
  "o'brien",
  "o''brien"
])
// メールアドレス（例示用・自動付与のものは通す）
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g
const OK_EMAIL =
  /@(example\.(com|org|net)|[\w.-]+\.example|users\.noreply\.github\.com)$|^(noreply@anthropic\.com|noreply@github\.com|git@github\.com)$/i

const findings = []
for (const { where, text } of targets) {
  if (text.includes('personal-info:allow')) continue
  for (const { kind, re } of needles) if (re.test(text)) findings.push({ where, kind, text })
  for (const m of text.matchAll(HOME)) {
    if (!DUMMY_HOME.has(m[1].toLowerCase())) findings.push({ where, kind: 'ホームのパス', text })
  }
  for (const m of text.matchAll(EMAIL)) {
    if (!OK_EMAIL.test(m[0])) findings.push({ where, kind: 'メールアドレス', text })
  }
}

if (findings.length === 0) {
  if (!hook) console.log('個人情報らしい文字列は見つかりませんでした')
  process.exit(0)
}
const out = [
  '個人情報らしい文字列が見つかりました。直してから commit・push してください',
  '（パスは ~ や %USERPROFILE% に、名前は伏せ字に置き換える。意図して載せる行は personal-info:allow を付ける）',
  ...findings.map((f) => `- ${f.where}: ${f.kind}: ${f.text.trim().slice(0, 160)}`)
].join('\n')
console.error(out)
// PreToolUse では終了コード 2 でツールの実行を止め、標準エラーが Claude に渡る
process.exit(hook ? 2 : 1)
