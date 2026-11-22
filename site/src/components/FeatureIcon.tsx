import { FileCode, Link, Monitor, Package, Terminal, Users } from 'lucide-react'

const ICONS = {
  'file-code': FileCode,
  terminal: Terminal,
  link: Link,
  monitor: Monitor,
  users: Users,
  package: Package
}

/** トップの特長のアイコン（ビルドで SVG にする。JS は送らない） */
export function FeatureIcon({ name }: { name: string }): React.JSX.Element | null {
  const Icon = ICONS[name as keyof typeof ICONS]
  return Icon ? <Icon size={22} strokeWidth={1.75} aria-hidden /> : null
}
