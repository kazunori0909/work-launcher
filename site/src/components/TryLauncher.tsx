import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'
import { t } from '../../../src/core/i18n'
import type { Lang } from '../../../src/core/i18n'
import {
  buildUrl,
  execKindFor,
  expandSelect,
  itemAt,
  itemLabel,
  pathKey,
  resolveSelections
} from '../../../src/core/items'
import type { RunEvent } from '../../../src/core/ipc'
import type { ExecKind, Item, Project } from '../../../src/core/types'
import { Console } from '../../../src/renderer/src/components/Console'
import { EmbedContext } from '../../../src/renderer/src/components/embedContext'
import type { EmbedContextValue } from '../../../src/renderer/src/components/embedContext'
import { Icon } from '../../../src/renderer/src/components/Icon'
import { InfoPage } from '../../../src/renderer/src/components/InfoPage'
import { ItemList } from '../../../src/renderer/src/components/PageView'
import { SelectContext } from '../../../src/renderer/src/components/selectContext'
import { Tooltip } from '../../../src/renderer/src/components/Tooltip'
import type { SelectContextValue } from '../../../src/renderer/src/components/selectContext'
import { DEFAULT_OPEN_SCHEMES } from '../../../src/core/schemes'
import { Code } from '../../../src/renderer/src/help/parts'
import { useConsole } from '../../../src/renderer/src/hooks/useConsole'
import { SITE } from '../i18n'
import { DEMO_CONSOLE_RULES, DEMO_ITEMS, DEMO_WORK_DIR, demoInfo } from '../try/demo'
import type { DemoItem } from '../try/demo'
import { WebHelp } from './WebHelp'

// 体験ページ。左はアプリの部品で描いたランチャーの画面、右は押したときに起こることのチャット。
// 何も実行しない。window.launcher を仮のものにして、アプリの InfoPage・コンソール（useConsole・Console）をそのまま描く。
// Info は getInfo が仮の値を返し、コンソールは onRunEvent に仮の実行の知らせ（開始・出力・終了）を流す

const PLATFORMS = [
  { value: 'win32', label: 'Windows' },
  { value: 'darwin', label: 'macOS' }
] as const

const osName = (platform: string): string =>
  PLATFORMS.find((p) => p.value === platform)?.label ?? platform

/** Office の種類ごとのアプリの名前（src/core/office.ts。Mac は Microsoft の付く名前） */
const OFFICE_APPS: Record<'excel' | 'powerpoint' | 'word', string> = {
  excel: 'Excel',
  powerpoint: 'PowerPoint',
  word: 'Word'
}

/** 吹き出しに出す、押したボタンの名前。アイコンだけのボタンはツールチップ */
function clickedLabel(item: Item, platform: string): string {
  if ('label' in item && item.label === '' && item.tooltip) return item.tooltip
  return itemLabel(item, platform)
}

/** 実行系の種類ごとに、アプリが起動するもの（src/core/runner.ts の commands の先頭の候補） */
const SHELLS: Record<ExecKind, Record<string, string>> = {
  bat: { win32: 'cmd.exe', darwin: 'cmd.exe' },
  sh: { win32: 'Git Bash', darwin: 'bash' },
  powershell: { win32: 'pwsh', darwin: 'pwsh' },
  python: { win32: 'py', darwin: 'python3' }
}

const noSubscribe = (): (() => void) => () => {}
const viewerPlatform = (): string => (navigator.userAgent.includes('Mac') ? 'darwin' : 'win32')
/** 相手の吹き出しが出るまでの間（入力中の表示を見せる） */
const REPLY_DELAY = 600

/** コンソールに出力を1行ずつ流す間（既定） */
const LINE_DELAY = 350

/**
 * window.launcher を仮のものにする。InfoPage は描いた直後に getInfo を、useConsole は onRunEvent を呼ぶので、
 * 描く前に差し替える
 */
let fakePlatform = 'win32'
const runListeners = new Set<(event: RunEvent) => void>()
function installFakeLauncher(platform: string): void {
  fakePlatform = platform
  if (typeof window === 'undefined') return
  Object.assign(window, {
    launcher: {
      getInfo: () =>
        new Promise((resolve) => setTimeout(() => resolve(demoInfo(fakePlatform)), 400)),
      onRunEvent: (listener: (event: RunEvent) => void) => {
        runListeners.add(listener)
        return () => runListeners.delete(listener)
      }
    }
  })
}
const emitRun = (event: RunEvent): void => runListeners.forEach((l) => l(event))

/** 仮の実行。出力を1行ずつ流してから終わる（実行ごとのタイマーは止めるときに消す） */
let nextRunId = 1
const runTimers = new Map<number, number[]>()

function fakeRun(
  start: Omit<Extract<RunEvent, { type: 'start' }>, 'type' | 'runId'>,
  lines: string[],
  code: number,
  delay = LINE_DELAY
): void {
  const runId = nextRunId++
  const { label } = start
  emitRun({ type: 'start', runId, ...start })
  const timers = lines.map((line, i) =>
    window.setTimeout(
      () => emitRun({ type: 'output', runId, stream: 'stdout', lines: [line] }),
      delay * (i + 1)
    )
  )
  timers.push(
    window.setTimeout(
      () => {
        runTimers.delete(runId)
        emitRun({ type: 'exit', runId, label, code, signal: null })
      },
      delay * (lines.length + 1)
    )
  )
  runTimers.set(runId, timers)
}

function stopFakeRun(runId: number, label: string): void {
  runTimers.get(runId)?.forEach(clearTimeout)
  runTimers.delete(runId)
  emitRun({ type: 'exit', runId, label, code: null, signal: 'SIGTERM' })
}

/** 吹き出し。user は右から（押した操作）、app は左から（起こること） */
interface Bubble {
  id: number
  side: 'user' | 'app'
  body: ReactNode
}

export function TryLauncher({ lang }: { lang: Lang }): React.JSX.Element {
  return (
    <WebHelp lang={lang}>
      <Demo lang={lang} />
    </WebHelp>
  )
}

function Demo({ lang }: { lang: Lang }): React.JSX.Element {
  const m = SITE[lang].try
  const demo = DEMO_ITEMS[lang]
  const items = useMemo(() => demo.map((d) => d.item), [demo])

  // 既定は見ている人の OS。ビルド時と hydration 中は Windows で描く
  const detected = useSyncExternalStore(noSubscribe, viewerPlatform, () => 'win32')
  const [chosen, setChosen] = useState<string>()
  const platform = chosen ?? detected
  installFakeLauncher(platform)

  const [tab, setTab] = useState<'main' | 'info'>('main')
  const [values, setValues] = useState<Record<string, string>>({})
  const chat = useChat(m.welcome)
  const consoleState = useConsole(DEMO_CONSOLE_RULES)
  const { counts, runs } = consoleState
  const running = new Set(runs.flatMap((r) => (r.path ? [pathKey(r.path)] : [])))

  const selections = useMemo<SelectContextValue>(() => {
    const project: Project = {
      styles: [],
      scripts: [],
      pages: [{ id: 'main', items }],
      info: { env: [], tools: [], registry: [] }
    }
    return {
      values: resolveSelections(project, values),
      onChange: (item, value) => setValues((v) => ({ ...v, [item.name]: value }))
    }
  }, [items, values])

  const embed = useMemo<EmbedContextValue>(
    () => ({
      mdfiles: {},
      openSchemes: DEFAULT_OPEN_SCHEMES,
      onLink: (href) =>
        chat.say(
          href,
          <>
            <p>{m.link}</p>
            <OpenHere href={href} label={m.tryOpen} />
          </>
        )
    }),
    [chat, m]
  )

  const activate = (path: number[]): void => {
    const item = itemAt(items, path)
    if (!item) return
    const found = findDemo(demo, item)
    const reply = explain(item, found, platform, selections.values, lang)
    if (reply) chat.say(m.clicked(clickedLabel(item, platform)), reply, { yaml: found?.yaml })
    const kind = item.kind === 'exec' ? execKindFor(item.scripts, platform) : undefined
    if (item.kind === 'exec' && kind && found) {
      fakeRun(
        {
          label: itemLabel(item, platform),
          pageId: 'main',
          path,
          kind,
          cwd: DEMO_WORK_DIR[platform],
          script: expandDemo(item.scripts[kind] ?? '', platform, selections.values)
        },
        found.output?.(platform) ?? [],
        found.exitCode ?? 0,
        found.lineDelay
      )
    }
  }

  const stop = (runId: number): void => {
    const label = runs.find((r) => r.runId === runId)?.label ?? ''
    stopFakeRun(runId, label)
    chat.say(m.clicked(t().console.stop(label)), <p>{m.stopped}</p>)
  }

  const openTab = (next: 'main' | 'info'): void => {
    if (next === tab) return
    setTab(next)
    if (next === 'info') {
      chat.say(
        m.openedTab('Info'),
        <>
          <p>{m.info}</p>
          <p>{m.infoCopy(t().info.copyText)}</p>
        </>
      )
    }
  }

  const switchPlatform = (next: string): void => {
    if (next === platform) return
    setChosen(next)
    chat.say(m.switched(osName(next)), <p>{m.platform}</p>)
  }

  return (
    <div className="s-try">
      <div className="s-try-launcher">
        <div className="s-try-os" role="group" aria-label={m.os}>
          <span>{m.os}</span>
          {PLATFORMS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={p.value === platform ? 'active' : undefined}
              aria-pressed={p.value === platform}
              onClick={() => switchPlatform(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="s-try-window">
          <div className="s-window-bar">
            <i></i>
            <i></i>
            <i></i>
          </div>
          <header className="header">
            <span className="header-title">{m.project}</span>
            <span className="header-version">WorkLauncher</span>
          </header>
          <nav className="tabs">
            <button
              type="button"
              className={tab === 'main' ? 'tab active' : 'tab'}
              onClick={() => openTab('main')}
            >
              <Icon name="house" />
              {m.mainTab}
            </button>
            <button
              type="button"
              className={tab === 'info' ? 'tab active' : 'tab'}
              onClick={() => openTab('info')}
            >
              <Icon name="monitor" />
              Info
            </button>
            {!consoleState.open && counts.size > 0 && (
              <button
                type="button"
                className="console-toggle"
                onClick={() => consoleState.setOpen(true)}
              >
                {t().console.title}
                {runs.length > 0 && t().console.running(runs.length)}
              </button>
            )}
          </nav>
          <EmbedContext.Provider value={embed}>
            <SelectContext.Provider value={selections}>
              <main className="s-try-page">
                {tab === 'info' ? (
                  <>
                    {/* 画面だけを見た人が、自分の PC の情報を読まれたと思わないように */}
                    <p className="s-try-notice">
                      <Icon name="info" size={14} />
                      {m.infoNotice}
                    </p>
                    <InfoPage key={`${platform}-${lang}`} />
                  </>
                ) : (
                  <ItemList
                    items={items}
                    platform={platform}
                    running={running}
                    onActivate={activate}
                  />
                )}
              </main>
            </SelectContext.Provider>
          </EmbedContext.Provider>
          {consoleState.open && (
            <Console
              lines={consoleState.lines}
              counts={counts}
              running={runs}
              onStop={(runId) => stop(runId)}
              onClear={consoleState.clear}
              onClose={() => consoleState.setOpen(false)}
            />
          )}
        </div>
      </div>
      <Tooltip />
      <ChatView title={m.chat} restart={m.restart} typing={m.typing} chat={chat} />
    </div>
  )
}

/** 押した項目の定義（書き方・出力の例）。グループの中のボタンは、そのボタンの分 */
function findDemo(demo: DemoItem[], item: Item): DemoItem | undefined {
  for (const d of demo) {
    const found = d.item === item ? d : d.children && findDemo(d.children, item)
    if (found) return found
  }
  return undefined
}

/**
 * 押した項目について、アプリで起こることの説明。説明の無い項目（見出しなど）は undefined。
 * demo は押した項目の定義
 */
function explain(
  item: Item,
  demo: DemoItem | undefined,
  platform: string,
  values: Record<string, string>,
  lang: Lang
): ReactNode | undefined {
  const m = SITE[lang].try
  if (!demo) return undefined
  const expand = (v: string): string => expandSelect(v, values).value

  if (item.kind === 'url') {
    const params = Object.fromEntries(
      Object.entries(item.params ?? {}).map(([k, v]) => [k, expand(v)])
    )
    const url = buildUrl(expand(item.url), params)
    return (
      <>
        <p>{m.url}</p>
        {demo.note && <p>{demo.note}</p>}
        <code className="s-try-value">{url}</code>
        {isExample(url) ? <p>{m.example}</p> : <OpenHere href={url} label={m.tryOpen} />}
      </>
    )
  }

  if (item.kind === 'open') {
    const isFile = /\.[a-z0-9]+$/i.test(item.path)
    const app = platform === 'win32' ? m.explorer : m.finder
    return (
      <>
        <p>{isFile ? m.file : m.folder(app)}</p>
        <code className="s-try-value">{workPath(item.path, platform)}</code>
      </>
    )
  }

  if (item.kind === 'excel' || item.kind === 'powerpoint' || item.kind === 'word') {
    const app = OFFICE_APPS[item.kind]
    return (
      <>
        {platform === 'win32' ? (
          <p>{item.readonly ? m.officeRead(app) : m.officeEdit(app)}</p>
        ) : (
          <p>
            {m.officeOpen(`Microsoft ${app}`)}
            {m.officeMac}
          </p>
        )}
        <code className="s-try-value">{workPath(item.path, platform)}</code>
      </>
    )
  }

  if (item.kind === 'exec') {
    const kind = execKindFor(item.scripts, platform)
    if (!kind) return undefined
    const label = itemLabel(item, platform)
    const script = item.scripts[kind] ?? ''
    const used = usedVariables(script)
    const code = demo.exitCode ?? 0
    return (
      <>
        {item.confirm && <p>{m.confirmed}</p>}
        <p>{m.exec(SHELLS[kind][platform] ?? kind)}</p>
        {used.length > 0 && (
          <>
            <p>{m.expanded(used.join('・'))}</p>
            <code className="s-try-value">{expandDemo(script, platform, values).trimEnd()}</code>
          </>
        )}
        <p>{m.console}</p>
        {code !== 0 && <p>{m.failed}</p>}
        {demo.lineDelay !== undefined && <p>{m.stoppable(t().console.stop(label))}</p>}
      </>
    )
  }
  return undefined
}

/** 設定の変数（アプリが実行する前に置き換えるもの。src/core/variables.ts と同じ形） */
const VARIABLE = /\$\{(launcherDir|workDir|env:[^}]+|select:[^}]+)\}/g

/** スクリプトに書かれた設定の変数（重なりを除いて、書かれた順） */
function usedVariables(script: string): string[] {
  return [...new Set([...script.matchAll(VARIABLE)].map((m) => m[0]))]
}

/**
 * 設定の変数を、体験ページの仮の値で置き換える。アプリの expandVariables は node:path を使うため
 * ブラウザでは読めない。体験ページで使う launcherDir・workDir・select だけを置き換える
 */
function expandDemo(script: string, platform: string, values: Record<string, string>): string {
  return expandSelect(script, values).value.replace(VARIABLE, (match, name: string) =>
    name === 'launcherDir' || name === 'workDir' ? DEMO_WORK_DIR[platform] : match
  )
}

/** 例のためのドメイン（RFC 2606）。開いても何もないので「開いてみる」を出さない */
const isExample = (url: string): boolean => /^https?:\/\/([^/]+\.)?example\.com\//.test(url)

/** 作業フォルダから数えたパス（仮の作業フォルダの場所で） */
function workPath(path: string, platform: string): string {
  const sep = platform === 'win32' ? '\\' : '/'
  return `${DEMO_WORK_DIR[platform]}${sep}${path.replaceAll('/', sep)}`
}

/** 説明の中の「このブラウザで開いてみる」（別のタブで開く） */
function OpenHere({ href, label }: { href: string; label: string }): React.JSX.Element {
  return (
    <a className="s-try-open" href={href} target="_blank" rel="noopener noreferrer">
      <Icon name="external-link" size={14} />
      {label}
    </a>
  )
}

interface Chat {
  bubbles: Bubble[]
  /** 相手の返事を待っている数（入力中の表示） */
  pending: number
  /** yaml は押した項目の書き方（自分の吹き出しに添える） */
  say(action: string, reply: ReactNode, options?: { yaml?: string }): void
  restart(): void
}

/** 押した操作をすぐに出し、少し置いてから説明を出す */
function useChat(welcome: string): Chat {
  const next = useRef(1)
  const timers = useRef<number[]>([])
  const first = useMemo<Bubble[]>(() => [{ id: 0, side: 'app', body: <p>{welcome}</p> }], [welcome])
  const [bubbles, setBubbles] = useState<Bubble[]>(first)
  const [pending, setPending] = useState(0)

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  return useMemo<Chat>(
    () => ({
      bubbles,
      pending,
      say(action, reply, options) {
        const id = next.current
        next.current += 2
        const body = (
          <>
            <p>{action}</p>
            {options?.yaml && <Code lang="yaml">{options.yaml}</Code>}
          </>
        )
        setBubbles((b) => [...b, { id, side: 'user', body }])
        setPending((n) => n + 1)
        timers.current.push(
          window.setTimeout(() => {
            setPending((n) => n - 1)
            setBubbles((b) => [...b, { id: id + 1, side: 'app', body: reply }])
          }, REPLY_DELAY)
        )
      },
      restart() {
        timers.current.forEach(clearTimeout)
        timers.current = []
        setPending(0)
        setBubbles(first)
      }
    }),
    [bubbles, pending, first]
  )
}

function ChatView({
  title,
  restart,
  typing,
  chat
}: {
  title: string
  restart: string
  typing: string
  chat: Chat
}): React.JSX.Element {
  const log = useRef<HTMLDivElement>(null)
  // 新しい吹き出しが見えるよう、チャットの中だけを送る（ページはスクロールさせない）。
  // 説明が長くても押した操作（書き方）から読めるよう、最後の自分の吹き出しより下へは送らない
  useEffect(() => {
    const el = log.current
    if (!el) return
    const users = el.querySelectorAll<HTMLElement>('.s-try-user')
    const last = users[users.length - 1]
    const bottom = el.scrollHeight - el.clientHeight
    const top = last ? Math.min(bottom, last.offsetTop - 12) : bottom
    el.scrollTo({ top, behavior: 'smooth' })
  }, [chat.bubbles.length, chat.pending])

  return (
    <section className="s-try-chat" aria-label={title}>
      <div className="s-try-chat-head">
        <span>{title}</span>
        <button type="button" onClick={chat.restart}>
          {restart}
        </button>
      </div>
      <div className="s-try-chat-log" ref={log} aria-live="polite">
        {chat.bubbles.map((b) => (
          <div key={b.id} className={`s-try-bubble s-try-${b.side}`}>
            {b.body}
          </div>
        ))}
        {chat.pending > 0 && (
          <div className="s-try-bubble s-try-app s-try-typing" aria-label={typing}>
            <i></i>
            <i></i>
            <i></i>
          </div>
        )}
      </div>
    </section>
  )
}
