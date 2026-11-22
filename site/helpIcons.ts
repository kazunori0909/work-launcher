import { readFileSync } from 'node:fs'
import { icons } from 'lucide-react'
import { iconKey, lookupIcon } from '../src/renderer/src/iconNames'

// Web サイトに入れるアイコンを、ヘルプのソースから拾う（全部入れると JS が大きいため）。
// 拾い漏れが無いかは helpIcons.test.ts で、見本のデータと突き合わせて確かめる

const root = new URL('../', import.meta.url)
const read = (path: string): string => readFileSync(new URL(path, root), 'utf-8')

/** ソースに出てくるアイコン名（見本の icon・既定のアイコン） */
export function helpIconNames(): string[] {
  const names = new Set<string>()
  for (const file of [
    'src/renderer/src/help/examples.ts',
    'src/renderer/src/help/examples.en.ts'
  ]) {
    for (const m of read(file).matchAll(/icon: '([a-z0-9-]+)'/g)) names.add(m[1])
  }
  const items = read('src/core/items.ts')
  const body = items.slice(
    items.indexOf('export function defaultIcon'),
    items.indexOf('function looksLikeFile')
  )
  for (const m of body.matchAll(/'([a-z][a-z0-9-]*)'/g)) names.add(m[1])
  return [...names]
}

/** 拾った名前を Lucide の書き出し名にする（無い名前は落とす） */
export function helpIconKeys(): string[] {
  const keys = new Set<string>()
  for (const name of helpIconNames()) {
    const icon = lookupIcon(icons, name)
    const key = Object.keys(icons).find((k) => icons[k as keyof typeof icons] === icon)
    if (key) keys.add(key)
    else if (icons[iconKey(name) as keyof typeof icons]) keys.add(iconKey(name))
  }
  return [...keys].sort()
}
