import type { HelpGroup } from '../book'
import { ConsoleColors } from './ConsoleColors'
import { Display } from './Display'
import { Edit } from './Edit'
import { Elements } from './Elements'
import { Errors } from './Errors'
import { Events } from './Events'
import { Functions } from './Functions'
import { Info } from './Info'
import { Items } from './Items'
import { LicensesSection } from './LicensesSection'
import { Look } from './Look'
import { Start } from './Start'
import { Variables } from './Variables'

/** 日本語のヘルプの章の一覧（正） */
export const HELP_JA: readonly HelpGroup[] = [
  {
    label: 'まず読む',
    sections: [
      { id: 'start', title: 'はじめに', Body: Start },
      { id: 'variables', title: '変数', Body: Variables },
      { id: 'edit', title: '設定ファイルの編集', Body: Edit },
      { id: 'errors', title: 'エラーが出たとき', Body: Errors },
      { id: 'licenses', title: 'ライセンス', Body: LicensesSection }
    ]
  },
  {
    label: '要素を追加する',
    sections: [
      { id: 'items', title: 'ボタンを追加', Body: Items },
      { id: 'elements', title: 'ボタン以外の要素', Body: Elements },
      { id: 'display', title: 'レイアウトと装飾', Body: Display },
      { id: 'functions', title: '関数から呼び出す', Body: Functions }
    ]
  },
  {
    label: '設定',
    sections: [
      { id: 'events', title: 'イベント', Body: Events },
      { id: 'console', title: 'コンソールの色分け', Body: ConsoleColors },
      { id: 'info', title: 'Info ページ', Body: Info },
      { id: 'look', title: 'タイトルと見た目', Body: Look }
    ]
  }
]
