import type { Project } from './types'
import { t } from './i18n'

// ヘルプの「config.local.yaml を作る」で書き出す雛形（中身の決め方は docs/config.md 5章）

/** 雛形で足すページの ID。案件に同じ ID があれば番号を付ける */
const NEW_PAGE_ID = 'my-page'

/** 組み込みページは「最初のページ」に選ばない */
const RESERVED = ['help', 'info']

export function localConfigTemplate(project: Project): string {
  const m = t().local.template
  const lines = [...m.head, '', 'pages:']
  const first = project.pages.find((p) => !RESERVED.includes(p.id))
  if (first) {
    lines.push(
      `  ${m.samePage}`,
      `  - id: ${first.id}`,
      '    items:',
      `      - md: ${m.samePageMd}`,
      ''
    )
  }
  lines.push(
    `  ${m.newPage}`,
    `  - id: ${newPageId(project)}`,
    `    title: ${m.newPageTitle}`,
    '    icon: user',
    '    items:',
    `      - md: ${m.newPageMd}`,
    '',
    'info:',
    '  tools:',
    ...toolLines(project)
  )
  return lines.join('\n') + '\n'
}

function newPageId(project: Project): string {
  const ids = new Set(project.pages.map((p) => p.id))
  let id = NEW_PAGE_ID
  for (let n = 2; ids.has(id); n++) id = `${NEW_PAGE_ID}-${n}`
  return id
}

/** Info のツールを git だけにする（git 以外を隠し、案件に無ければ git を足す） */
function toolLines(project: Project): string[] {
  const names = project.info.tools.map((t) => t.name)
  const others = names.filter((n) => n !== 'git')
  const m = t().local.template
  const lines: string[] = []
  if (others.length > 0) {
    lines.push(`    ${m.hidden}`)
    for (const name of others) lines.push(`    - { name: ${yamlString(name)}, hidden: true }`)
  }
  if (!names.includes('git')) {
    lines.push(`    ${m.builtin}`, '    - git')
  }
  lines.push(`    ${m.custom}`, '    # - { name: Maven, command: mvn -v }')
  return lines
}

/** YAML の流れ形式にそのまま置けない名前は引用符で囲む */
function yamlString(s: string): string {
  return /^[A-Za-z0-9_.-][\w .-]*$/.test(s) && !s.endsWith(' ') ? s : JSON.stringify(s)
}
