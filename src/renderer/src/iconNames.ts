// アイコンの名前の変換。lucide に依存させない（Web サイトでは、使うアイコンだけを入れるため。→ site/src/icons.ts）

/** 設定に書く名前（file-text）を Lucide の書き出し名（FileText）にする */
export const iconKey = (name: string): string =>
  name
    .split('-')
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('')

const loose = (s: string): string => s.replaceAll('-', '').toLowerCase()
const looseMaps = new WeakMap<object, Map<string, string>>()

/**
 * 表から名前でアイコンを引く。名前どおりで無ければ、ハイフンと大文字小文字を無視して引く
 * （arrow-down-a-z と arrow-down-az のどちらでも引ける）
 */
export function lookupIcon<T>(table: Record<string, T>, name: string): T | undefined {
  let map = looseMaps.get(table)
  if (!map) {
    map = new Map(Object.keys(table).map((k) => [loose(k), k]))
    looseMaps.set(table, map)
  }
  return table[iconKey(name)] ?? table[map.get(loose(name)) ?? '']
}

/** 一覧に出す名前（FileText → file-text） */
export function iconName(key: string): string {
  return key
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Za-z])(\d)/g, '$1-$2')
    .toLowerCase()
}
