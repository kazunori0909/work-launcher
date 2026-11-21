import type { Messages } from './ja'

// 英語の辞書。形は ja.ts に合わせる（足りないキー・余分なキーは型エラーになる）

/** 件数と名詞（1 のときだけ単数） */
const count = (n: number, noun: string): string => `${n} ${noun}${n === 1 ? '' : 's'}`

export const en: Messages = {
  paren: (s) => ` (${s})`,
  list: (items) => items.join(' · '),
  unknown: 'Unknown',
  notSet: '(not set)',
  noProject: 'No project is open',

  load: {
    noFile: 'File not found',
    topNotMap: 'Write the top level as key-value pairs',
    badVersion: (v) => `version ${v} is not supported (supported: 1)`,
    noVersion: 'version is missing (write 1)',
    top: 'Top level',
    badScheme: (x) => `List scheme names (such as http or file) in openSchemes: ${x}`,
    forbiddenScheme: (name) => `${name} cannot be listed in openSchemes`,
    includeNotPath: 'Write a file path in include',
    includeMissing: (p) => `Included file not found: ${p}`,
    pageNotMap: 'Write a page as key-value pairs',
    badPageId: (id) => `Invalid page ID: ${id} (letters, digits, - and _)`,
    page: (id) => `Page ${id}`,
    pageItems: (id) => `items of page ${id}`,
    groupItems: (title) => `items of group ${title}`,
    item: (name) => `Item ${name}`,
    notList: (where) => `Write ${where} as a list starting with "- "`,
    notPaths: (where) => `List paths in ${where}`,
    notString: (key) => `${key} must be a string`,
    notBoolean: (key) => `${key} must be true or false`,
    unknownKey: (where, key) => `${where}: unknown key ${key}`,
    badControlId: (control, name) => `Invalid ${control} ID: ${name} (letters, digits, - and _)`,
    nestedGroup: 'A group cannot contain another group',
    groupTitle: 'Write the heading text in group (optional)',
    groupNoItems: 'List the contents of group under items',
    buttonsNotList: 'List the buttons in buttons with "- "',
    buttonsOnly: (kind) => `Only button items can be placed in buttons (${kind} cannot)`,
    itemNotMap: 'Write an item as key-value pairs',
    noTypeKey: (keys) => `No type key (${keys.join(' / ')})`,
    manyTypeKeys: (keys) => `More than one type key: ${keys.join(', ')}`,
    execPair: (keys) => `Only bat and sh can be written together: ${keys.join(', ')}`,
    noValue: (key) => `${key} has no value`,
    notNameValue: (key) => `Write ${key} as "name: value" pairs`,
    defaultNotInOptions: (v) => `default is not in options: ${v}`,
    sameOnOff: (v) => `on and off have the same value: ${v}`,
    noOptions: (kind) => `List the choices of ${kind} under options with "- "`,
    badOption: 'List values or { label, value } in options',
    infoNotMap: 'Write info as key-value pairs',
    infoEnv: 'List environment variable names in info.env',
    infoRegistry: 'Write value paths or { name, path } in info.registry',
    registryRoot: (p) => `A registry path must start with HKLM\\, HKCU\\ or similar: ${p}`,
    infoTools: 'Write tool names or { name, command, pattern, hidden } in info.tools',
    toolNeedsCommand: (name) => `A tool that is not built in needs command: ${name}`,
    rulesNotList: 'List the rules under rules:',
    ruleNoPattern: 'A rule needs pattern',
    ruleFlags: (p) => `flags must be a string: ${p}`,
    ruleLevel: (levels, p) => `level must be one of ${levels.join(' / ')}: ${p}`,
    ruleColor: (p) => `color must be a string: ${p}`,
    ruleRegex: (p) => `Invalid regular expression: ${p}`,
    mdMissing: (p) => `md file not found: ${p}`,
    styleMissing: 'style file not found',
    unknownIcon: (name) => `No icon named ${name} (use a Lucide name)`
  },

  run: {
    notExec: 'This item cannot be run',
    notOnThisOs: 'Cannot run on this OS',
    notOnThisOsOnly: (kinds) => `Cannot run on this OS (${kinds.join(' / ')} only)`,
    envMissing: (name) => `Environment variable ${name} is not defined`,
    noWorkDir: (dir) => `Working folder not found: ${dir}`,
    selectMissing: (name) => `select ${name} not found`,
    storePython:
      'Python not found. Only the Microsoft Store placeholder python.exe seems to exist. Install Python from python.org or elsewhere',
    noGitBash: 'Git Bash (Git for Windows), which runs sh, was not found',
    noCommand: (kind) => `Command to run was not found (${kind})`,
    itemNotFound: 'Item not found (the settings may have changed)',
    notYet: 'This item cannot be used yet',
    errorLabel: 'Error'
  },

  ctx: {
    firstArg: 'The first argument must be a string',
    secondArg: 'The second argument must be { key: value }',
    unknownKeys: (unknown, keys) =>
      `Unknown keys: ${unknown.join(', ')}` +
      (keys.length > 0 ? ` (allowed: ${keys.join(' / ')})` : ''),
    notString: (key) => `${key} must be a string`,
    notBoolean: (key) => `${key} must be true or false`,
    notMap: (key) => `${key} must be { name: value }`
  },

  script: {
    fileMissing: (f) => `scripts file not found: ${f}`,
    noFiles: 'No JS files in scripts',
    denied: 'Running JS (scripts) was not allowed',
    exited: (code) => `scripts.js exited (code ${code})`,
    noFunction: (fn, files) => `No function ${fn} (${files})`,
    manyFunctions: (fn, files) => `Function ${fn} is in more than one file (${files})`,
    trustButtons: ['Trust and run', 'Cancel'],
    trustMessage: "Run this project's JS (scripts)?",
    trustDetail:
      'JS listed in scripts can do anything on this PC. Allow it only for projects whose contents you trust. You will not be asked again for this project.'
  },

  open: {
    notFound: (p) => `Not found: ${p}`,
    failed: (reason) => `Could not open: ${reason}`,
    badFileUrl: (url) => `This file: URL cannot be turned into a path: ${url}`,
    badUrl: (url) => `Invalid URL: ${url}`,
    schemeDenied: (scheme, url) =>
      `Cannot open ${scheme}: (not allowed by openSchemes in config.yaml): ${url}`,
    badLink: 'Invalid link',
    noProjectFile: (file, dir) => `${file} not found: ${dir}`
  },

  local: {
    noConfig: 'Cannot create it because config.yaml could not be read',
    cannotCreate: (file, reason) => `Cannot create ${file}: ${reason}`,
    exists: (file) => `${file} already exists`,
    existsDetail:
      'It will not be overwritten. To create it again, delete the file and press the button again.',
    created: (file) => `Created ${file}`,
    createdDetail:
      'The examples are already shown in the window. Edit and save the file, and it is reloaded right away.',
    template: {
      head: [
        '# Your own settings (created with "Create config.local.yaml" in Help)',
        '# Written the same way as config.yaml and layered on top of the shared settings. Saving updates the window',
        '# These settings are not for others, so add this file to .gitignore'
      ],
      samePage:
        '# A page with the same ID as a shared page adds items to its end (replace: true replaces it entirely)',
      samePageMd: 'This message is added from config.local.yaml',
      newPage: '# A page with a new ID is added after the last tab',
      newPageTitle: 'Mine',
      newPageMd: 'This page is added from config.local.yaml',
      hidden: '# hidden: true hides a tool listed in the shared settings',
      builtin: '# A name alone adds a built-in tool',
      custom: '# For a tool that is not built in, write command (and pattern)'
    }
  },

  console: {
    title: 'Console',
    running: (n) => ` (${n} running)`,
    errors: (n) => `Errors ${n}`,
    warnings: (n) => `Warnings ${n}`,
    all: 'All',
    warnUp: 'Warnings and up',
    errorOnly: 'Errors only',
    clear: 'Clear',
    stop: (label) => `■ Stop ${label}`,
    close: 'Close (output is kept)',
    folded: (n) => `… (${count(n, 'line')})`,
    ok: (label) => `■ ${label} finished (code 0)`,
    stopped: (label) => `■ ${label} stopped`,
    failed: (label, code) => `■ ${label} failed (code ${code})`
  },

  info: {
    bootDisk: 'Startup disk',
    unsupported: 'Not available on this OS',
    mismatch: 'pattern did not match',
    notInstalled: 'Not installed',
    cores: (n) => count(Number(n), 'core'),
    used: (s) => `${s} in use`,
    slots: (used, all) => `slots ${used}/${all}`,
    display: (s) => `display ${s}`,
    region: (s) => `region ${s}`,
    system: (s) => `system ${s}`,
    computerName: 'Computer name',
    userName: 'User name',
    language: 'Language',
    hardware: 'Hardware',
    memory: 'Memory',
    noDrive: 'Not available',
    free: (free, total) => `${free} free / ${total}`,
    network: ' (network)',
    tools: 'Tools',
    drives: 'Drives',
    env: 'Environment variables',
    registry: 'Registry',
    psFailed: 'Could not get the OS version, GPU, drives or registry (PowerShell failed)',
    linuxPartial: 'GPU, drives and memory in use are not shown on this OS yet',
    loading: 'Loading…',
    refresh: 'Refresh',
    copied: 'Copied',
    copyText: 'Copy as text',
    copySection: (title) => `Copy ${title}`,
    toolsHint: ['List names (git, node, etc.) in', 'to show their versions'],
    envHint: ['List names in', 'to show them'],
    registryHint: ['List value paths in', 'to show them']
  },

  ui: {
    loading: 'Loading…',
    cannotLoad: 'Could not load the settings',
    openOther: 'Open another project…',
    help: 'Help',
    noPages: 'No pages',
    closingWait: 'Waiting for cleanup (beforeClose) to finish…',
    closeNow: 'Close without waiting',
    diagnostics: (errors, warnings) =>
      `Settings problems: ${count(errors, 'error')}, ${count(warnings, 'warning')}`,
    startLead1: 'Open the',
    startLead2: 'file of a project. You can also double-click it or drop it on the app icon.',
    openProject: 'Open project…',
    recent: 'Recent projects',
    langSwitch: 'Display language'
  },

  help: {
    notOpen: '(not open)',
    cheatKind: 'Type',
    cheatCode: 'Code',
    preview: 'Preview',
    sampleRan: 'Would run (this is a sample, so nothing runs):',
    iconSearch: 'Search by name (e.g. folder, play, file)',
    iconCount: (n) => count(n, 'icon'),
    iconShown: (max) => ` (showing the first ${max})`,
    iconCopied: (name) => ` · Copied icon: ${name}`,
    licenseListBuiltOnly: 'The list is shown only in a built app.',
    noLicenseText: (license) => `(no license text: ${license})`
  },

  menu: {
    file: 'File',
    newWindow: 'New Window',
    openProject: 'Open Project…',
    recent: 'Open Recent',
    clearRecent: 'Clear Menu',
    openDialogTitle: 'Open Project'
  }
}
