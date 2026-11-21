// メインと画面の IPC の約束。チャンネル名と型はここだけに書き、プリロードとメインはここから作る。
// 画面とメインの両方から使うため、型と定数だけを置く（node: モジュール・Electron に依存させない）
import type { SystemInfo } from './info'
import type { ExecKind, ProjectView, ThirdPartyLicense } from './types'

export type RunEvent =
  /** function（scripts.js）からの知らせ。error のときだけコンソールを開く */
  | { type: 'message'; level: 'info' | 'error'; text: string }
  | {
      type: 'start'
      runId: number
      label: string
      /** 押した項目のページ。function から始めた実行には無い */
      pageId?: string
      /** 項目の位置の並び（入れ子なら外側から） */
      path?: number[]
      kind: ExecKind
      /** 実行を始める作業フォルダ（絶対パス） */
      cwd: string
      /** 実行する本文（変数を置き換えた後） */
      script: string
    }
  | { type: 'output'; runId: number; stream: 'stdout' | 'stderr'; lines: string[] }
  | {
      type: 'exit'
      runId: number
      label: string
      code: number | null
      signal: string | null
      /** 起動できなかったときの理由 */
      error?: string
    }

/** 失敗したときだけ error が入る */
export type ActionResult = { error?: string }

/** 画面からメインに頼む処理（invoke）。画面からは window.launcher の同じ名前の関数で呼ぶ */
export interface InvokeApi {
  /** 開いている案件を読む（ウィンドウが見つからなければ undefined） */
  loadProject(): Promise<ProjectView | undefined>
  /** 「案件を開く…」のダイアログ。開始画面から呼ぶとそのウィンドウで開き、それ以外は新しいウィンドウで開く */
  openProjectDialog(): Promise<void>
  /** 最近開いた案件を開く（開き方は openProjectDialog と同じ） */
  openProject(launcherDir: string): Promise<ActionResult>
  /** 最近開いた案件のフォルダ（新しい順） */
  listRecent(): Promise<string[]>
  /** path は項目の位置の並び（入れ子なら外側から）、select は画面で選んでいる値 */
  run(
    pageId: string,
    path: number[],
    select: Record<string, string>
  ): Promise<{ runId: number } | { error: string }>
  stop(runId: number): Promise<void>
  /** 実行系以外の項目を動かす */
  activate(pageId: string, path: number[], select: Record<string, string>): Promise<ActionResult>
  /** 案件フォルダを開く（ヘルプから使う） */
  openProjectFolder(): Promise<ActionResult>
  /** launcher/config.local.yaml の雛形を作る（ヘルプから使う）。作れた・既にあるはメインがポップアップで知らせる */
  createLocalConfig(): Promise<ActionResult>
  /** md・html のリンクを開く（baseDir は相対パスの起点） */
  openLink(href: string, baseDir: string): Promise<ActionResult>
  /** Info ページの値を集める（ツールの確認で数秒かかることがある） */
  getInfo(): Promise<SystemInfo>
  /** アプリに入っているサードパーティのライブラリとライセンス文（開発中は空のことがある） */
  listLicenses(): Promise<ThirdPartyLicense[]>
  /**
   * select の値を画面で変えた。remember: true なら記憶し（メインで選択肢にあるか確かめる）、
   * change があればその関数を呼ぶ（前の change が終わってから）。select は変えたあとのすべての値
   */
  changeSelection(
    name: string,
    value: string,
    change: string | undefined,
    select: Record<string, string>
  ): Promise<ActionResult>
  /** 閉じるのを待っている beforeClose を止めて、すぐ閉じる */
  closeNow(): Promise<void>
}

export const INVOKE_CHANNELS = {
  loadProject: 'project:load',
  openProjectDialog: 'project:openDialog',
  openProject: 'project:open',
  listRecent: 'recent:list',
  run: 'run:start',
  stop: 'run:stop',
  activate: 'item:activate',
  openProjectFolder: 'project:openFolder',
  createLocalConfig: 'project:createLocalConfig',
  openLink: 'link:open',
  getInfo: 'info:get',
  listLicenses: 'licenses:list',
  changeSelection: 'select:change',
  closeNow: 'window:closeNow'
} as const satisfies Record<keyof InvokeApi, string>

/** メインから画面への知らせ（チャンネル → 中身） */
export interface EventPayloads {
  'run:event': RunEvent
  /** 設定ファイルが変わって読み直したとき */
  'project:changed': ProjectView
  /** 閉じる前の beforeClose を待っている（しばらく終わらないとき） */
  'project:closing': undefined
}

/** 知らせを受ける関数。戻り値を呼ぶと購読をやめる */
export interface EventApi {
  onRunEvent(listener: (event: RunEvent) => void): () => void
  onProjectChanged(listener: (view: ProjectView) => void): () => void
  onClosing(listener: () => void): () => void
}

export const EVENT_CHANNELS = {
  onRunEvent: 'run:event',
  onProjectChanged: 'project:changed',
  onClosing: 'project:closing'
} as const satisfies Record<keyof EventApi, keyof EventPayloads>

export type LauncherApi = InvokeApi & EventApi
