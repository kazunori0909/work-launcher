import type { Project } from './types'

// ヘルプの「config.local.yaml を作る」で書き出す雛形（中身の決め方は docs/config.md 5章）

/** 雛形で足すページの ID。案件に同じ ID があれば番号を付ける */
const NEW_PAGE_ID = 'my-page'

/** 組み込みページは「最初のページ」に選ばない */
const RESERVED = ['help', 'info']

export function localConfigTemplate(project: Project): string {
  const lines = [
    '# 自分だけの設定（ヘルプの「config.local.yaml を作る」で作りました）',
    '# 書き方は config.yaml と同じで、共通の設定に重ねて読みます。保存すると画面に反映されます',
    '# ほかの人に見せない設定なので、.gitignore に入れてください',
    '',
    'pages:'
  ]
  const first = project.pages.find((p) => !RESERVED.includes(p.id))
  if (first) {
    lines.push(
      '  # 共通と同じ ID のページは、そのページの最後に項目を足す（replace: true で丸ごと置き換え）',
      `  - id: ${first.id}`,
      '    items:',
      '      - md: このメッセージは、config.local.yaml から追加しています',
      ''
    )
  }
  lines.push(
    '  # 新しい ID のページは、タブの最後に足す',
    `  - id: ${newPageId(project)}`,
    '    title: 自分用',
    '    icon: user',
    '    items:',
    '      - md: このページは、config.local.yaml から追加しています',
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
  const lines: string[] = []
  if (others.length > 0) {
    lines.push('    # hidden: true で、共通の設定にあるツールを出さない')
    for (const name of others) lines.push(`    - { name: ${yamlString(name)}, hidden: true }`)
  }
  if (!names.includes('git')) {
    lines.push('    # 名前だけなら組み込みの取り方で足す', '    - git')
  }
  lines.push(
    '    # 組み込みに無いツールは command（と pattern）を書いて足す',
    '    # - { name: Maven, command: mvn -v }'
  )
  return lines
}

/** YAML の流れ形式にそのまま置けない名前は引用符で囲む */
function yamlString(s: string): string {
  return /^[A-Za-z0-9_.-][\w .-]*$/.test(s) && !s.endsWith(' ') ? s : JSON.stringify(s)
}
