import { isMdFilePath } from '../items'
import type { AlertKind } from '../alert'
import { BUTTON_KINDS, EXEC_KINDS } from '../types'
import type { ExecKind, Item, ItemCommon, ItemWhen, SelectControl, SelectOption } from '../types'
import { isObj, scalar } from './reader'
import type { Obj, Reader } from './reader'
import { t } from '../i18n'
import { pickText } from './text'

// 項目の読み方。種類キーごとに「書けるキー」と「読み方」を表（KINDS）に並べる（仕様は docs/config.md）

export const PAGE_ID = /^[A-Za-z0-9_-]+$/

const COMMON_KEYS = ['id', 'label', 'icon', 'tooltip', 'confirm']
const SELECT_KEYS = ['label', 'tooltip', 'options', 'default', 'remember', 'change']
/** 押せる項目（ボタン・枠・select 系）に書ける、押せる・押せないの条件 */
const WHEN_KEYS = ['enabledWhen', 'disabledWhen']
const BUTTON_KEYS = [...COMMON_KEYS, ...WHEN_KEYS]

/** 項目の中身を読むときに使う道具。誤りは problem に積み、最後にまとめてその項目のエラーにする */
interface ItemFields {
  raw: Obj
  /** 実行系なら書かれた種類キー（bat・sh など） */
  execs: ExecKind[]
  common: ItemCommon
  /** グループ・ボタングループの中の項目ならその種類 */
  parent?: 'group' | 'buttons'
  str(key: string): string | undefined
  /** 無ければ problem に積み、'' を返す */
  req(key: string): string
  /** 画面に出す文字（文字列か言語の表）。reqText は無ければ problem に積み、'' を返す */
  text(key: string): string | undefined
  reqText(key: string): string
  dict(key: string): Record<string, string> | undefined
  problem(message: string): void
  /** 子の項目の並びを読む */
  children(raw: unknown, where: string, parent?: 'group'): Item[]
  /** 子の項目を1つ読む */
  child(raw: unknown, parent: 'buttons'): Item
}

interface KindSpec {
  /** 書けるキー（種類キーは除く） */
  keys: readonly string[]
  /** 項目を作る。文字列を返せば、ほかの誤りによらずその文言でエラーの項目にする */
  read(f: ItemFields): Item | string
}

const office = (kind: 'excel' | 'powerpoint' | 'word'): KindSpec => ({
  keys: [...BUTTON_KEYS, 'readonly'],
  read: (f) => {
    const readonly = f.raw.readonly ?? false
    if (typeof readonly !== 'boolean') f.problem(t().load.notBoolean('readonly'))
    return { ...f.common, kind, path: f.req(kind), readonly: readonly === true }
  }
})

const alert = (level: AlertKind): KindSpec => ({
  keys: ['id'],
  read: (f) => ({
    kind: 'alert',
    id: f.common.id,
    level,
    // `|` で書いた末尾の改行は空行に見えるので落とす
    text: f.reqText(level).replace(/\n+$/, '')
  })
})

const select = (control: SelectControl): KindSpec => ({
  keys:
    control === 'checkbox'
      ? ['label', 'tooltip', 'on', 'off', 'default', 'remember', 'change', ...WHEN_KEYS]
      : [...SELECT_KEYS, ...WHEN_KEYS],
  read: (f) => {
    const name = f.req(control)
    if (name && !PAGE_ID.test(name)) {
      f.problem(t().load.badControlId(control, name))
    }
    const remember = f.raw.remember ?? false
    if (typeof remember !== 'boolean') f.problem(t().load.notBoolean('remember'))
    const change = f.str('change')
    const { options, def } =
      control === 'checkbox'
        ? checkboxOptions(f.raw, f.problem)
        : selectOptionsWithDefault(f.raw, control, f.problem)
    return {
      kind: 'select',
      id: name,
      name,
      control,
      label: f.common.label,
      tooltip: f.common.tooltip,
      options,
      default: def,
      remember: remember === true,
      ...(change !== undefined ? { change } : {})
    }
  }
})

/**
 * 種類キーの表。並び順は、エラーの文言に出す種類キーの順でもある。
 * `exec` は bat・sh・powershell・python のどれか（bat と sh は併記できる）
 */
const KINDS = {
  function: {
    keys: BUTTON_KEYS,
    read: (f) => ({ ...f.common, kind: 'function', fn: f.req('function') })
  },
  excel: office('excel'),
  powerpoint: office('powerpoint'),
  word: office('word'),
  open: { keys: BUTTON_KEYS, read: (f) => ({ ...f.common, kind: 'open', path: f.req('open') }) },
  exec: {
    keys: [...BUTTON_KEYS, 'cwd', 'env', 'encoding'],
    read: (f) => ({
      ...f.common,
      kind: 'exec',
      scripts: Object.fromEntries(f.execs.map((k) => [k, f.req(k)])),
      cwd: f.str('cwd'),
      env: f.dict('env'),
      encoding: f.str('encoding')
    })
  },
  html: {
    keys: COMMON_KEYS,
    read: (f) => ({ ...f.common, kind: 'html', content: f.reqText('html') })
  },
  md: {
    keys: COMMON_KEYS,
    // 1行で .md で終わればファイルのパス、それ以外は本文（→ docs/config.md 3.4）
    read: (f) => {
      const value = f.reqText('md')
      return isMdFilePath(value)
        ? { ...f.common, kind: 'mdfile', path: value.trim() }
        : { ...f.common, kind: 'markdown', content: value }
    }
  },
  url: {
    keys: [...BUTTON_KEYS, 'params'],
    read: (f) => ({ ...f.common, kind: 'url', url: f.req('url'), params: f.dict('params') })
  },
  reset: {
    keys: BUTTON_KEYS,
    read: (f) => {
      const v = f.raw.reset
      const ids = typeof v === 'string' ? [v] : Array.isArray(v) ? v : undefined
      if (!ids || ids.length === 0 || !ids.every((id) => typeof id === 'string' && id !== '')) {
        f.problem(t().load.resetIds)
        return { ...f.common, kind: 'reset', ids: [] }
      }
      return { ...f.common, kind: 'reset', ids: [...new Set(ids as string[])] }
    }
  },
  note: alert('note'),
  tip: alert('tip'),
  important: alert('important'),
  warning: alert('warning'),
  caution: alert('caution'),
  break: { keys: COMMON_KEYS, read: (f) => ({ kind: 'break', id: f.common.id }) },
  heading: {
    keys: COMMON_KEYS,
    read: (f) => ({ kind: 'heading', id: f.common.id, text: f.reqText('heading') })
  },
  group: {
    keys: ['id', 'icon', 'items', ...WHEN_KEYS],
    read: (f) => {
      if (f.parent === 'group') return t().load.nestedGroup
      const title = f.raw.group === null ? undefined : pickText(f.raw.group)
      if (f.raw.group != null && title === undefined) f.problem(t().load.groupTitle)
      if (f.raw.items === undefined) f.problem(t().load.groupNoItems)
      const items = f.children(f.raw.items, t().load.groupItems(title ?? ''), 'group')
      return {
        kind: 'group',
        id: f.common.id,
        icon: f.common.icon,
        title,
        items
      }
    }
  },
  details: {
    keys: ['id', 'icon', 'text', 'items', 'expanded', 'frame'],
    read: (f) => {
      const title = f.reqText('details')
      // `|` で書いた末尾の改行は空行に見えるので落とす
      const text = f.text('text')?.replace(/\n+$/, '')
      // `open` は種類キー（ファイルを開く）なので、開いて出すのは expanded と書く
      const open = f.raw.expanded ?? false
      if (typeof open !== 'boolean') f.problem(t().load.notBoolean('expanded'))
      const frame = f.raw.frame ?? false
      if (typeof frame !== 'boolean') f.problem(t().load.notBoolean('frame'))
      if (text === undefined && f.raw.items === undefined) f.problem(t().load.detailsEmpty)
      const items =
        f.raw.items === undefined ? [] : f.children(f.raw.items, t().load.detailsItems(title))
      return {
        kind: 'details',
        id: f.common.id,
        icon: f.common.icon,
        title,
        ...(text !== undefined ? { text } : {}),
        open: open === true,
        frame: frame === true,
        items
      }
    }
  },
  buttons: {
    keys: ['id', ...WHEN_KEYS],
    read: (f) => {
      if (!Array.isArray(f.raw.buttons)) {
        f.problem(t().load.buttonsNotList)
        return { kind: 'buttons', id: f.common.id, items: [] }
      }
      const items = f.raw.buttons.map((b): Item => {
        const child = f.child(b, 'buttons')
        if (child.kind === 'error' || (BUTTON_KINDS as readonly string[]).includes(child.kind)) {
          return child
        }
        return {
          kind: 'error',
          id: child.id,
          message: t().load.buttonsOnly(child.kind === 'select' ? child.control : child.kind)
        }
      })
      return { kind: 'buttons', id: f.common.id, items }
    }
  },
  select: select('select'),
  radio: select('radio'),
  checkbox: select('checkbox')
} satisfies Record<string, KindSpec>

type KindKey = keyof typeof KINDS

/** 項目に書ける種類キー（実行系は bat・sh などに分けて並べる） */
export const TYPE_KEYS: readonly string[] = (Object.keys(KINDS) as KindKey[]).flatMap((k) =>
  k === 'exec' ? [...EXEC_KINDS] : [k]
)

const isExecKind = (k: string): k is ExecKind => (EXEC_KINDS as readonly string[]).includes(k)

/** 項目を読む。parent は、グループ・ボタングループの中の項目ならその種類 */
export function readItem(
  r: Reader,
  raw: unknown,
  file: string,
  parent?: 'group' | 'buttons'
): Item {
  if (raw === 'break') return { kind: 'break' }
  if (!isObj(raw)) return { kind: 'error', message: t().load.itemNotMap }
  const id = typeof raw.id === 'string' ? raw.id : undefined
  const types = TYPE_KEYS.filter((k) => k in raw)
  const execs = types.filter(isExecKind)
  const shown = pickText(raw.label)
  const where = shown !== undefined ? `${shown}: ` : ''
  const fail = (message: string): Item => ({ kind: 'error', id, message: where + message })

  if (types.length === 0) return fail(t().load.noTypeKey([...TYPE_KEYS]))
  if (types.length > 1 && execs.length !== types.length) {
    return fail(t().load.manyTypeKeys(types))
  }
  if (execs.length > 1 && !(execs.length === 2 && execs.includes('bat') && execs.includes('sh'))) {
    return fail(t().load.execPair(execs))
  }

  const kind: KindKey = execs.length > 0 ? 'exec' : (types[0] as KindKey)
  const problems: string[] = []
  const problem = (message: string): void => void problems.push(message)
  const str = (key: string): string | undefined => {
    const v = raw[key]
    if (v === undefined) return undefined
    if (typeof v === 'string') return v
    problem(t().load.notString(key))
    return undefined
  }
  const text = (key: string): string | undefined => {
    const v = raw[key]
    if (v === undefined) return undefined
    const picked = pickText(v)
    if (picked === undefined) problem(t().load.notText(key))
    return picked
  }
  const fields: ItemFields = {
    raw,
    execs,
    parent,
    common: {
      id: str('id'),
      label: text('label'),
      icon: str('icon'),
      tooltip: text('tooltip'),
      confirm: text('confirm')
    },
    str,
    text,
    reqText: (key) => {
      const v = text(key)
      if (v === undefined && raw[key] === undefined) problem(t().load.noValue(key))
      return v ?? ''
    },
    req: (key) => {
      const v = str(key)
      if (v === undefined && raw[key] === undefined) problem(t().load.noValue(key))
      return v ?? ''
    },
    dict: (key) => {
      const v = raw[key]
      if (v === undefined) return undefined
      if (!isObj(v) || Object.values(v).some((x) => typeof x === 'object')) {
        problem(t().load.notNameValue(key))
        return undefined
      }
      return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, String(x ?? '')]))
    },
    problem,
    children: (v, w, p) => r.list(v, file, w).map((i) => readItem(r, i, file, p)),
    child: (v, p) => readItem(r, v, file, p)
  }

  const spec: KindSpec = KINDS[kind]
  const when = spec.keys.includes('enabledWhen') ? readWhen(raw, problem) : undefined
  const read = spec.read(fields)
  if (typeof read === 'string') return fail(read)
  if (problems.length > 0) return fail(problems.join(' / '))
  const item = when ? ({ ...read, when } as Item) : read
  r.warnUnknown(
    raw,
    [...spec.keys, ...types],
    file,
    t().load.item(String(fields.common.label ?? types[0]))
  )
  return item
}

/** enabledWhen・disabledWhen。select の ID → 値（並びも書ける）。どちらか一方だけ */
function readWhen(raw: Obj, problem: (message: string) => void): ItemWhen | undefined {
  const keys = WHEN_KEYS.filter((k) => raw[k] !== undefined)
  if (keys.length === 0) return undefined
  if (keys.length > 1) {
    problem(t().load.bothWhen)
    return undefined
  }
  const key = keys[0]
  const v = raw[key]
  if (!isObj(v) || Object.keys(v).length === 0) {
    problem(t().load.whenNotMap(key))
    return undefined
  }
  const values: ItemWhen['values'] = {}
  for (const [id, x] of Object.entries(v)) {
    const list = Array.isArray(x) ? x : [x]
    const ok = list.map((y) => (typeof y === 'boolean' ? y : scalar(y)))
    if (ok.length === 0 || ok.some((y) => y === undefined)) {
      problem(t().load.whenValue(key, id))
      return undefined
    }
    values[id] = ok as Array<string | boolean>
  }
  return { enabled: key === 'enabledWhen', values }
}

/** ページ・グループの items を読む */
export function readItems(r: Reader, raw: unknown, file: string, where: string): Item[] {
  return r.list(raw, file, where).map((i) => readItem(r, i, file))
}

/** select・radio の options と default */
function selectOptionsWithDefault(
  raw: Obj,
  kind: string,
  problem: (message: string) => void
): { options: SelectOption[]; def?: string } {
  const options = selectOptions(raw.options, kind, problem)
  const def = raw.default === undefined ? undefined : scalar(raw.default)
  if (raw.default !== undefined && !options.some((o) => o.value === def)) {
    problem(t().load.defaultNotInOptions(String(raw.default)))
  }
  return { options, def }
}

/** checkbox は on・off の値を選択肢にする（オンが先）。default は true / false */
function checkboxOptions(
  raw: Obj,
  problem: (message: string) => void
): { options: SelectOption[]; def: string } {
  const value = (key: 'on' | 'off', fallback: string): string => {
    if (raw[key] === undefined) return fallback
    const v = scalar(raw[key])
    if (v === undefined) problem(t().load.notString(key))
    return v ?? fallback
  }
  const on = value('on', 'true')
  const off = value('off', 'false')
  if (on === off) problem(t().load.sameOnOff(on))
  const checked = raw.default ?? false
  if (typeof checked !== 'boolean') problem(t().load.notBoolean('default'))
  const options = [
    { label: 'on', value: on },
    { label: 'off', value: off }
  ]
  return { options, def: checked === true ? on : off }
}

/** select・radio の options。値だけか { label, value } を並べる */
function selectOptions(
  raw: unknown,
  kind: string,
  problem: (message: string) => void
): SelectOption[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    problem(t().load.noOptions(kind))
    return []
  }
  const options: SelectOption[] = []
  for (const o of raw) {
    const value = isObj(o) ? scalar(o.value) : scalar(o)
    const label = isObj(o) ? (o.label === undefined ? value : pickText(o.label)) : value
    if (value === undefined || label === undefined) {
      problem(t().load.badOption)
      return []
    }
    options.push({ label, value })
  }
  return options
}
