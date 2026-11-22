import type { Lang } from '../../src/core/i18n'

// Web にだけ出す文言（トップ・ヘッダー・ドキュメントの枠）。ja が正、en は型で揃える。
// 章の本文はヘルプ（src/renderer/src/help/sections/）にある

const ja = {
  htmlLang: 'ja',
  siteDescription:
    '案件でよく使うコマンド・資料・URL をボタンにまとめる、Windows / macOS のデスクトップアプリ',
  nav: {
    docs: 'ドキュメント',
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
    tryIt: '見本のボタンは押せます。実行する内容が下に出ます。'
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
  nav: { docs: 'Docs', releases: 'Releases', download: 'Download', github: 'GitHub' },
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
    tryIt: 'The sample buttons can be clicked. What they would run is shown below them.'
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
