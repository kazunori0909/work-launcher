// 日本語の辞書（正）。en.ts はこの形に合わせる。キーは使う場所ごとにまとめる

export const ja = {
  /** 括弧書き（日本語は全角） */
  paren: (s: string) => `（${s}）`,
  list: (items: readonly string[]) => items.join('・'),
  unknown: '不明',
  notSet: '（未設定）',
  noProject: '案件が開かれていません',

  load: {
    noFile: 'ファイルがありません',
    topNotMap: '最上位はキーと値の組で書いてください',
    badVersion: (v: string) => `version ${v} には対応していません（対応: 1）`,
    noVersion: 'version がありません（1 と書く）',
    top: '最上位',
    badScheme: (x: string) => `openSchemes にはスキーム名（http・file など）を並べてください: ${x}`,
    forbiddenScheme: (name: string) => `openSchemes に ${name} は書けません`,
    includeNotPath: 'include にはファイルのパスを書いてください',
    includeMissing: (p: string) => `include 先がありません: ${p}`,
    pageNotMap: 'ページはキーと値の組で書いてください',
    badPageId: (id: string) => `ページ ID が正しくありません: ${id}（英数字と - _）`,
    page: (id: string) => `ページ ${id}`,
    pageItems: (id: string) => `ページ ${id} の items`,
    groupItems: (title: string) => `group ${title} の items`,
    item: (name: string) => `項目 ${name}`,
    notList: (where: string) => `${where} は「- 」で始まる並びで書いてください`,
    notPaths: (where: string) => `${where} にはパスを並べてください`,
    notString: (key: string) => `${key} は文字列で書いてください`,
    notText: (key: string) => `${key} は文字列か { ja: …, en: … } で書いてください`,
    notBoolean: (key: string) => `${key} は true / false で書いてください`,
    unknownKey: (where: string, key: string) => `${where}: 未知のキー ${key}`,
    badControlId: (control: string, name: string) =>
      `${control} の ID が正しくありません: ${name}（英数字と - _）`,
    nestedGroup: 'グループの中にグループは置けません',
    groupTitle: 'group には見出しの文字を書いてください（省略可）',
    groupNoItems: 'group には items で中の項目を並べてください',
    buttonsNotList: 'buttons にはボタンを「- 」で並べてください',
    buttonsOnly: (kind: string) =>
      `buttons に置けるのはボタンになる項目だけです（${kind} は置けません）`,
    itemNotMap: '項目はキーと値の組で書いてください',
    noTypeKey: (keys: readonly string[]) => `種類キーがありません（${keys.join(' / ')}）`,
    manyTypeKeys: (keys: readonly string[]) => `種類キーが複数あります: ${keys.join(', ')}`,
    execPair: (keys: readonly string[]) => `併記できるのは bat と sh だけです: ${keys.join(', ')}`,
    noValue: (key: string) => `${key} に値がありません`,
    notNameValue: (key: string) => `${key} は「名前: 値」の組で書いてください`,
    defaultNotInOptions: (v: string) => `default が options にありません: ${v}`,
    sameOnOff: (v: string) => `on と off が同じ値です: ${v}`,
    noOptions: (kind: string) => `${kind} には options で選択肢を「- 」で並べてください`,
    badOption: 'options には値か { label, value } を並べてください',
    infoNotMap: 'info はキーと値の組で書いてください',
    infoEnv: 'info.env には環境変数の名前を並べてください',
    infoRegistry: 'info.registry には値のパスか { name, path } を書いてください',
    registryRoot: (p: string) => `レジストリのパスは HKLM\\ や HKCU\\ などで始めてください: ${p}`,
    infoTools: 'info.tools にはツール名か { name, command, pattern, hidden } を書いてください',
    toolNeedsCommand: (name: string) => `組み込みに無いツールには command が要ります: ${name}`,
    rulesNotList: 'rules: の下にルールを並べてください',
    ruleNoPattern: 'ルールには pattern が要ります',
    ruleFlags: (p: string) => `flags は文字列です: ${p}`,
    ruleLevel: (levels: readonly string[], p: string) =>
      `level は ${levels.join(' / ')} のどれかです: ${p}`,
    ruleColor: (p: string) => `color は文字列です: ${p}`,
    ruleRegex: (p: string) => `正規表現が正しくありません: ${p}`,
    mdMissing: (p: string) => `md のファイルがありません: ${p}`,
    styleMissing: 'style のファイルがありません',
    unknownIcon: (name: string) => `アイコン ${name} はありません（Lucide の名前を書く）`
  },

  run: {
    notExec: '実行できる項目ではありません',
    notOnThisOs: 'この OS では実行できません',
    notOnThisOsOnly: (kinds: readonly string[]) =>
      `この OS では実行できません（${kinds.join(' / ')} のみ）`,
    envMissing: (name: string) => `環境変数 ${name} が定義されていません`,
    noWorkDir: (dir: string) => `作業フォルダがありません: ${dir}`,
    selectMissing: (name: string) => `select ${name} がありません`,
    storePython:
      'Python が見つかりません。Microsoft Store の案内用の python.exe しか無いようです。python.org などから Python を入れてください',
    noGitBash: 'sh を実行する Git Bash（Git for Windows）が見つかりません',
    noCommand: (kind: string) => `実行するコマンドが見つかりません（${kind}）`,
    itemNotFound: '項目が見つかりません（設定が変わった可能性があります）',
    notYet: 'この項目はまだ動かせません',
    errorLabel: 'エラー'
  },

  ctx: {
    firstArg: '1つ目の引数は文字列で書いてください',
    secondArg: '2つ目の引数は { キー: 値 } で書いてください',
    unknownKeys: (unknown: string[], keys: readonly string[]) =>
      `書けないキーです: ${unknown.join(', ')}` +
      (keys.length > 0 ? `（書けるのは ${keys.join(' / ')}）` : ''),
    notString: (key: string) => `${key} は文字列で書いてください`,
    notBoolean: (key: string) => `${key} は true / false で書いてください`,
    notMap: (key: string) => `${key} は { 名前: 値 } で書いてください`,
    setValue: '2つ目の引数は文字列か true / false で書いてください',
    ids: '引数は ID の文字列か、その配列で書いてください',
    unknownId: (id: string) => `ID が ${id} の項目がありません`,
    notOperable: (id: string) =>
      `${id} は押せる項目ではありません（ボタン・group・buttons・select・radio・checkbox を指定してください）`,
    noSelect: (id: string) => `ID が ${id} の select・radio・checkbox がありません`,
    noSelectIn: (id: string) =>
      `${id} は select・radio・checkbox でなく、中にも select・radio・checkbox がありません`,
    booleanForCheckbox: 'true / false で書けるのは checkbox だけです',
    notOption: (id: string, value: string, values: string[]) =>
      `${value} は ${id} の選択肢にありません（選べるのは ${values.join(' / ')}）`
  },

  script: {
    fileMissing: (f: string) => `scripts のファイルがありません: ${f}`,
    noFiles: 'scripts に JS ファイルがありません',
    denied: 'JS（scripts）の実行を許可しませんでした',
    exited: (code: string) => `scripts.js が終了しました（コード ${code}）`,
    noFunction: (fn: string, files: string) => `関数 ${fn} がありません（${files}）`,
    manyFunctions: (fn: string, files: string) =>
      `関数 ${fn} が複数のファイルにあります（${files}）`,
    trustButtons: ['信頼して実行', 'キャンセル'],
    trustMessage: 'この案件の JS（scripts）を実行しますか？',
    trustDetail:
      'scripts に並べた JS は PC 上で何でも実行できます。内容を信頼できる案件だけ許可してください。この案件では次から確認しません。'
  },

  open: {
    notFound: (p: string) => `見つかりません: ${p}`,
    failed: (reason: string) => `開けませんでした: ${reason}`,
    badFileUrl: (url: string) => `パスに直せない file: の URL です: ${url}`,
    badUrl: (url: string) => `URL が正しくありません: ${url}`,
    schemeDenied: (scheme: string, url: string) =>
      `${scheme}: は開けません（config.yaml の openSchemes で許可していません）: ${url}`,
    badLink: 'リンクが正しくありません',
    noProjectFile: (file: string, dir: string) => `${file} がありません: ${dir}`
  },

  local: {
    noConfig: 'config.yaml を読めていないため作れません',
    cannotCreate: (file: string, reason: string) => `${file} を作れません: ${reason}`,
    exists: (file: string) => `${file} は既にあります`,
    existsDetail: '上書きはしません。作り直すときは、ファイルを消してからもう一度押してください。',
    created: (file: string) => `${file} を作りました`,
    createdDetail: '書き方の例を画面に反映しています。編集して保存すると、すぐに読み直します。',
    /** config.local.yaml の雛形のコメントと文言 */
    template: {
      head: [
        '# 自分だけの設定（ヘルプの「config.local.yaml を作る」で作りました）',
        '# 書き方は config.yaml と同じで、共通の設定に重ねて読みます。保存すると画面に反映されます',
        '# ほかの人に見せない設定なので、.gitignore に入れてください'
      ],
      samePage:
        '# 共通と同じ ID のページは、そのページの最後に項目を足す（replace: true で丸ごと置き換え）',
      samePageMd: 'このメッセージは、config.local.yaml から追加しています',
      newPage: '# 新しい ID のページは、タブの最後に足す',
      newPageTitle: '自分用',
      newPageMd: 'このページは、config.local.yaml から追加しています',
      hidden: '# hidden: true で、共通の設定にあるツールを出さない',
      builtin: '# 名前だけなら組み込みの取り方で足す',
      custom: '# 組み込みに無いツールは command（と pattern）を書いて足す'
    }
  },

  console: {
    title: 'コンソール',
    running: (n: number) => `（実行中 ${n}）`,
    errors: (n: number) => `エラー ${n}`,
    warnings: (n: number) => `警告 ${n}`,
    all: 'すべて',
    warnUp: '警告以上',
    errorOnly: 'エラーのみ',
    clear: 'クリア',
    stop: (label: string) => `■ ${label} を停止`,
    close: '閉じる（内容は残る）',
    folded: (n: number) => `…（全 ${n} 行）`,
    ok: (label: string) => `■ ${label} 終了（コード 0）`,
    stopped: (label: string) => `■ ${label} 停止しました`,
    failed: (label: string, code: number) => `■ ${label} 失敗（コード ${code}）`
  },

  info: {
    /** Mac の / のドライブに付ける名前（OS の値ではない。ほかのドライブは OS のボリューム名のまま） */
    bootDisk: '起動ディスク',
    unsupported: 'この OS では取れません',
    mismatch: 'pattern が一致しません',
    notInstalled: '未インストール',
    cores: (n: number | string) => `${n} コア`,
    used: (s: string) => `使用中 ${s}`,
    slots: (used: number, all: number) => `スロット ${used}/${all}`,
    display: (s: string) => `表示 ${s}`,
    region: (s: string) => `地域 ${s}`,
    system: (s: string) => `システム ${s}`,
    computerName: 'コンピュータ名',
    userName: 'ユーザー名',
    language: '言語',
    hardware: 'ハードウェア',
    memory: 'メモリ',
    noDrive: '取得できません',
    free: (free: string, total: string) => `空き ${free} / ${total}`,
    network: '（ネットワーク）',
    tools: 'ツール',
    drives: 'ドライブ',
    env: '環境変数',
    registry: 'レジストリ',
    psFailed:
      'OS のバージョン・GPU・ドライブ・レジストリを取得できませんでした（PowerShell が失敗しました）',
    linuxPartial: 'この OS では GPU・ドライブ・使用中のメモリをまだ表示できません',
    loading: '取得中…',
    refresh: '更新',
    copied: 'コピーしました',
    copyText: 'テキストでコピー',
    copySection: (title: string) => `${title}をコピー`,
    /** 空の枠のヒント（コードの前と後ろ） */
    toolsHint: ['設定の', 'に名前（git・node など）を並べると、バージョンを表示します'],
    vulnLink: '脆弱性を調べる（Zero Wire）',
    envHint: ['設定の', 'に名前を並べると表示します'],
    registryHint: ['設定の', 'に値のパスを並べると表示します']
  },

  ui: {
    loading: '読み込み中…',
    cannotLoad: '設定を読み込めませんでした',
    openOther: '別の案件を開く…',
    help: 'ヘルプ',
    noPages: 'ページがありません',
    closingWait: '後片付け（beforeClose）が終わるのを待っています…',
    closeNow: '待たずに閉じる',
    diagnostics: (errors: number, warnings: number) =>
      `設定の問題: エラー ${errors} 件・警告 ${warnings} 件`,
    startLead1: '案件の',
    startLead2: 'を開いてください。ダブルクリックやアプリのアイコンへのドロップでも開けます。',
    openProject: '案件を開く…',
    recent: '最近開いた案件',
    langSwitch: '表示の言語'
  },

  /** ヘルプの部品の文言（章の本文は renderer/src/help/sections/<言語>/） */
  help: {
    notOpen: '（開かれていません）',
    cheatKind: '種類',
    cheatCode: 'コード',
    preview: '表示',
    sampleRan: '実行する内容（見本なので実行はしません）:',
    sampleOpened: '開く URL（見本なので開きません）:',
    iconSearch: '英語で検索（例: folder, play, file）',
    iconCount: (n: number) => `${n} 件`,
    iconShown: (max: number) => `（先頭 ${max} 件を表示）`,
    iconCopied: (name: string) => ` ・ icon: ${name} をコピーしました`,
    licenseListBuiltOnly: '一覧はビルドしたアプリでだけ出ます。',
    licenseListInApp: 'ライブラリごとのライセンス文は、アプリのヘルプで読めます。',
    noLicenseText: (license: string) => `（ライセンス文なし: ${license}）`
  },

  menu: {
    file: 'ファイル',
    newWindow: '新規ウィンドウ',
    openProject: '案件を開く…',
    recent: '最近開いた案件',
    clearRecent: 'メニューを消去',
    openDialogTitle: '案件を開く'
  }
}

export type Messages = typeof ja
