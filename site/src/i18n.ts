import type { Lang } from '../../src/core/i18n'

// Web にだけ出す文言（トップ・ヘッダー・ドキュメントの枠）。ja が正、en は型で揃える。
// 章の本文はヘルプ（src/renderer/src/help/sections/）にある

const ja = {
  htmlLang: 'ja',
  siteDescription:
    '案件でよく使うコマンド・資料・URL をボタンにまとめる、Windows / macOS のデスクトップアプリ',
  nav: {
    docs: 'ドキュメント',
    try: '体験',
    releases: 'リリースノート',
    download: 'ダウンロード',
    github: 'GitHub'
  },
  langSwitch: 'English',
  hero: {
    badge: 'Windows / macOS ・ MIT ライセンス',
    title: ['案件のコマンドと資料を、', 'ボタン1つに。'],
    lead: 'リポジトリに YAML を置くだけで、ビルド・デプロイのスクリプト、仕様書、チケット起票の URL が1つの画面に並びます。チームの誰が開いても同じ手順です。',
    primary: 'ダウンロード',
    secondary: 'ドキュメントを読む'
  },
  features: {
    title: 'できること',
    items: [
      {
        icon: 'file-code',
        title: 'YAML を置くだけ',
        body: 'launcher/config.yaml にページとボタンを書きます。保存するとすぐ画面に反映されます。'
      },
      {
        icon: 'terminal',
        title: 'スクリプトをボタンで',
        body: 'bat・sh・PowerShell・Python をボタン1つで実行し、出力と終了コードをコンソールで見られます。'
      },
      {
        icon: 'link',
        title: 'URL を日本語のまま',
        body: '検索やチケット起票の URL を、パラメータを日本語のまま書けます。エンコードはアプリが行います。'
      },
      {
        icon: 'monitor',
        title: 'PC の情報を1画面で',
        body: 'OS・CPU・ツールのバージョン・レジストリの値などを並べ、テキストでコピーできます。'
      },
      {
        icon: 'users',
        title: 'チームで共有、自分で上書き',
        body: '共通の設定はリポジトリに、自分だけのボタンは config.local.yaml に。重ねて読みます。'
      },
      {
        icon: 'package',
        title: 'ポータブル版を同梱',
        body: 'Windows では exe をリポジトリに置けば、インストールせずにダブルクリックで開けます。'
      }
    ]
  },
  how: {
    title: 'しくみ',
    lead: '案件のフォルダに、空の work.launcher と launcher/config.yaml を置きます。書いた設定は、下のようなボタンになります。',
    tryIt: '見本のボタンは押せます。実行する内容が下に出ます。',
    tryPage: 'アプリの画面をまるごと触る'
  },
  shots: {
    title: '画面',
    hero: 'サンプル案件で Python のボタンを押したところ',
    main: 'ボタンを並べたページ',
    info: 'Info ページ（PC の情報）'
  },
  download: {
    title: 'ダウンロード',
    lead: 'GitHub の Releases から、使う環境に合ったファイルを選びます。',
    button: 'Releases を開く',
    files: [
      { os: 'Windows', name: 'win-x64-setup.exe', note: 'インストール版' },
      { os: 'Windows', name: 'win-x64-portable.exe', note: 'ポータブル版（インストール不要）' },
      { os: 'macOS', name: 'mac-apple-silicon-arm64.dmg', note: 'Apple Silicon（M1 以降）' },
      { os: 'macOS', name: 'mac-intel-x64.dmg', note: 'Intel' },
      { os: '', name: 'sample-<ver>.zip', note: '試しに使えるサンプル案件' }
    ],
    unsignedTitle: '初めて起動するとき',
    unsigned: [
      'アプリには署名がないため、OS が警告を出します。',
      'Windows: 「Windows によって PC が保護されました」と出たら、「詳細情報」→「実行」を押します。',
      'macOS: 「システム設定 > プライバシーとセキュリティ」を開き、WorkLauncher の「このまま開く」を押します（初回だけ）。'
    ]
  },
  docs: {
    menu: '目次',
    onThisPage: 'このページ',
    prev: '前へ',
    next: '次へ',
    platform: '見本の OS',
    edit: 'ヘルプの原稿を GitHub で見る'
  },
  try: {
    title: 'ブラウザで触ってみる',
    lead: 'ランチャーの画面のボタンを押すと、アプリで押したときに何が起こるかを吹き出しで説明します。ここでは実際には実行しません。',
    project: 'デモ案件',
    mainTab: 'メイン',
    os: 'OS',
    chat: '何が起こるか',
    restart: 'はじめから',
    typing: '入力中',
    welcome: 'ボタンを押してみてください。アプリで押したときに何が起こるかを、ここで説明します。',
    clicked: (label: string) => `「${label}」を押した`,
    openedTab: (name: string) => `${name} タブを開いた`,
    switched: (os: string) => `OS を ${os} にした`,
    url: '既定のブラウザで、この URL を開きます。params の値は、アプリがエンコードして付けます。',
    tryOpen: 'このブラウザで開いてみる',
    example: 'この URL は例の場所（example.com）なので、ここでは開けません。',
    folder: (app: string) =>
      `${app}で、このフォルダを開きます。相対パスは作業フォルダから数えます。`,
    file: '既定のアプリで、このファイルを開きます。相対パスは作業フォルダから数えます。',
    officeRead: (app: string) => `${app}で、このファイルを読み取り専用で開きます。`,
    officeEdit: (app: string) => `${app}で、このファイルを編集できる形で開きます。`,
    officeOpen: (app: string) => `${app}で、このファイルを開きます。`,
    officeMac:
      'Office が入っていなければ、既定のアプリ（Numbers・Pages など）で開きます。readonly（読み取り専用）は Windows だけで効きます。',
    explorer: 'エクスプローラー',
    finder: 'Finder',
    exec: (shell: string) => `コンソールを開き、指定されたコマンドを ${shell} で実行します。`,
    confirmed: 'confirm に書いた確認を出し、OK を押したときだけ実行します。',
    stoppable: (stop: string) => `実行中は、コンソールの「${stop}」で止められます。`,
    stopped: '実行中のスクリプトを止めます。コンソールに「停止しました」と出ます。',
    expanded: (names: string) =>
      `${names} は、実行する前に値に置き換えます。置き換えたあとのコマンドは次のとおりです。`,
    failed:
      '終了コードが 0 以外なので、失敗として赤く出ます。行の色分けは console.yaml の rules で決めます（ここでは WARN と ERROR の行）。',
    console: '出力と終了コードは、下のコンソールに出ます。',
    infoNotice: 'デモの値です。この PC の情報は読んでいません。',
    info: 'PC の情報を取って並べます（ここに出ているのは仮の値です）。設定の info に書いた環境変数・ツール・レジストリ（Windows だけ）も出ます。',
    infoCopy: (copy: string) =>
      `「${copy}」を押すと、全部をテキストで写せます。問い合わせのときに貼れます。`,
    platform:
      'OS によって、動くボタンが変わります。bat は Windows だけで、ほかの OS では押せません。sh は Windows では Git Bash で動きます。',
    link: '既定のブラウザで、このリンクを開きます。'
  },
  releases: {
    title: 'リリースノート',
    lead: 'バージョンごとの変更です。上げる前に、使っているバージョンより新しい破壊的変更が無いかを確かめてください。',
    breakingIndex: '破壊的変更のあったバージョン',
    onlyBreaking: '破壊的変更のあるバージョンだけ表示',
    breakingBadge: '破壊的変更あり',
    github: 'GitHub の Release',
    kinds: { breaking: '破壊的変更', added: '新機能', changed: '変更', fixed: '修正' }
  },
  footer: 'MIT License'
}

export type SiteMessages = typeof ja

const en: SiteMessages = {
  htmlLang: 'en',
  siteDescription:
    'A desktop app for Windows and macOS that puts your project’s commands, documents and URLs on buttons',
  nav: {
    docs: 'Docs',
    try: 'Try it',
    releases: 'Releases',
    download: 'Download',
    github: 'GitHub'
  },
  langSwitch: '日本語',
  hero: {
    badge: 'Windows / macOS · MIT License',
    title: ['Your project’s commands and docs,', 'one click away.'],
    lead: 'Put a YAML file in your repository, and build and deploy scripts, specs and issue-form URLs line up on one screen. Everyone on the team gets the same steps.',
    primary: 'Download',
    secondary: 'Read the docs'
  },
  features: {
    title: 'Features',
    items: [
      {
        icon: 'file-code',
        title: 'Just a YAML file',
        body: 'Write pages and buttons in launcher/config.yaml. Save it, and the screen updates right away.'
      },
      {
        icon: 'terminal',
        title: 'Scripts on buttons',
        body: 'Run bat, sh, PowerShell and Python with one click, and see the output and exit code in the console.'
      },
      {
        icon: 'link',
        title: 'No manual URL encoding',
        body: 'Write query parameters as plain values — spaces, symbols, any language. The app URL-encodes them for you.'
      },
      {
        icon: 'monitor',
        title: 'Your PC on one screen',
        body: 'See the OS, CPU, tool versions, registry values and more, and copy them as text.'
      },
      {
        icon: 'users',
        title: 'Shared, with your own extras',
        body: 'Keep the shared config in the repository and your own buttons in config.local.yaml. The app layers them.'
      },
      {
        icon: 'package',
        title: 'Portable build',
        body: 'On Windows, commit the exe to the repository and open it with a double-click, no install needed.'
      }
    ]
  },
  how: {
    title: 'How it works',
    lead: 'Put an empty work.launcher and launcher/config.yaml in your project folder. The config turns into buttons like these.',
    tryIt: 'The sample buttons can be clicked. What they would run is shown below them.',
    tryPage: 'Try the whole app screen'
  },
  shots: {
    title: 'Screens',
    hero: 'The sample project after clicking the Python button',
    main: 'A page of buttons',
    info: 'The Info page (your PC’s details)'
  },
  download: {
    title: 'Download',
    lead: 'Pick the file for your system from the Releases on GitHub.',
    button: 'Open Releases',
    files: [
      { os: 'Windows', name: 'win-x64-setup.exe', note: 'Installer' },
      { os: 'Windows', name: 'win-x64-portable.exe', note: 'Portable (no install)' },
      { os: 'macOS', name: 'mac-apple-silicon-arm64.dmg', note: 'Apple Silicon (M1 or later)' },
      { os: 'macOS', name: 'mac-intel-x64.dmg', note: 'Intel' },
      { os: '', name: 'sample-<ver>.zip', note: 'A sample project to try' }
    ],
    unsignedTitle: 'The first launch',
    unsigned: [
      'The app is not signed, so the OS shows a warning.',
      'Windows: when “Windows protected your PC” appears, click “More info”, then “Run anyway”.',
      'macOS: open “System Settings > Privacy & Security” and click “Open Anyway” for WorkLauncher (first time only).'
    ]
  },
  docs: {
    menu: 'Contents',
    onThisPage: 'On this page',
    prev: 'Previous',
    next: 'Next',
    platform: 'Sample OS',
    edit: 'See the help source on GitHub'
  },
  try: {
    title: 'Try it in your browser',
    lead: 'Click the buttons on the launcher screen, and a chat explains what the app would do. Nothing actually runs here.',
    project: 'Demo project',
    mainTab: 'Main',
    os: 'OS',
    chat: 'What happens',
    restart: 'Start over',
    typing: 'Typing',
    welcome: 'Click a button. I’ll explain here what the app does when you click it.',
    clicked: (label: string) => `Clicked “${label}”`,
    openedTab: (name: string) => `Opened the ${name} tab`,
    switched: (os: string) => `Switched the OS to ${os}`,
    url: 'Opens this URL in the default browser. The app URL-encodes the params values and appends them.',
    tryOpen: 'Open it in this browser',
    example: 'This URL points to an example address (example.com), so it can’t be opened here.',
    folder: (app: string) =>
      `Opens this folder in ${app}. Relative paths start from the work folder.`,
    file: 'Opens this file in its default app. Relative paths start from the work folder.',
    officeRead: (app: string) => `Opens this file read-only in ${app}.`,
    officeEdit: (app: string) => `Opens this file for editing in ${app}.`,
    officeOpen: (app: string) => `Opens this file in ${app}.`,
    officeMac:
      'Without Office, it opens in the default app (Numbers, Pages and so on). readonly works only on Windows.',
    explorer: 'File Explorer',
    finder: 'Finder',
    exec: (shell: string) => `Opens the console and runs the given command with ${shell}.`,
    confirmed: 'Shows the confirm message first, and runs only when you click OK.',
    stoppable: (stop: string) => `While it runs, you can stop it with “${stop}” in the console.`,
    stopped: 'Stops the running script. The console shows that it was stopped.',
    expanded: (names: string) =>
      `${names} is replaced with its value before running. The command after replacing is:`,
    failed:
      'The exit code isn’t 0, so it shows as failed in red. Line colors come from the rules in console.yaml (here, the WARN and ERROR lines).',
    console: 'The output and exit code appear in the console below.',
    infoNotice: 'These are demo values. Nothing is read from your PC.',
    info: 'Collects and lists your PC’s details (the values here are made up). The environment variables, tools and registry values (Windows only) listed under info in the config appear too.',
    infoCopy: (copy: string) =>
      `Click “${copy}” to copy everything as text, ready to paste into a support request.`,
    platform:
      'Which buttons work depends on the OS. bat runs only on Windows and can’t be clicked elsewhere. On Windows, sh runs with Git Bash.',
    link: 'Opens this link in the default browser.'
  },
  releases: {
    title: 'Release notes',
    lead: 'Changes in each version. Before upgrading, check for breaking changes newer than the version you use.',
    breakingIndex: 'Versions with breaking changes',
    onlyBreaking: 'Show only versions with breaking changes',
    breakingBadge: 'Breaking changes',
    github: 'Release on GitHub',
    kinds: { breaking: 'Breaking changes', added: 'New', changed: 'Changed', fixed: 'Fixed' }
  },
  footer: 'MIT License'
}

export const SITE: Record<Lang, SiteMessages> = { ja, en }

/** サイト内のパス。ja は /、en は /en/ の下に置く */
export function href(lang: Lang, path = ''): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  return `${base}/${lang === 'en' ? 'en/' : ''}${path}`
}

/** [...lang] の getStaticPaths の値（ja は URL に言語を出さない） */
export const LANG_PARAMS: { lang: Lang; param: string | undefined }[] = [
  { lang: 'ja', param: undefined },
  { lang: 'en', param: 'en' }
]

export const REPO_URL = 'https://github.com/kazunori0909/work-launcher'
