import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(execFile)

// osascript（JavaScript）で動かす。Finder を前面に出さずにフォルダを開き、開いたウィンドウが
// 現れる（一番手前が変わる・新しい番号が増える）のを待ってから、Finder の主ウィンドウだけを前面に出す。
// プロセスの起動を1回で済ませるため、すべてこの中で行う
const OPEN_FOLDER_SCRIPT = `
ObjC.import('AppKit')
ObjC.import('CoreGraphics')

function finderWindows(pid) {
  const list = ObjC.castRefToObject(
    $.CGWindowListCopyWindowInfo($.kCGWindowListOptionOnScreenOnly | $.kCGWindowListExcludeDesktopElements, 0)
  )
  const ids = []
  for (let i = 0; i < list.count; i++) {
    const w = list.objectAtIndex(i)
    if (ObjC.unwrap(w.objectForKey('kCGWindowOwnerPID')) === pid && ObjC.unwrap(w.objectForKey('kCGWindowLayer')) === 0) {
      ids.push(ObjC.unwrap(w.objectForKey('kCGWindowNumber')))
    }
  }
  return ids
}

function run(argv) {
  const finder = $.NSRunningApplication.runningApplicationsWithBundleIdentifier('com.apple.finder').firstObject
  const before = finder ? finderWindows(finder.processIdentifier) : []
  const opened = $.NSWorkspace.sharedWorkspace.openURLsWithAppBundleIdentifierOptionsAdditionalEventParamDescriptorLaunchIdentifiers(
    $([$.NSURL.fileURLWithPath(argv[0])]),
    'com.apple.finder',
    $.NSWorkspaceLaunchWithoutActivation,
    $.NSAppleEventDescriptor.nullDescriptor,
    null
  )
  if (!opened) throw new Error('Finder で開けませんでした')
  if (!finder) return
  for (let i = 0; i < 50; i++) {
    const now = finderWindows(finder.processIdentifier)
    if (now[0] !== before[0] || now.some((id) => !before.includes(id))) break
    delay(0.02)
  }
  finder.activateWithOptions(0)
}
`

/**
 * Mac でフォルダを開き、そのウィンドウだけを前面に出す。普通に開くと Finder が丸ごと前面に来て、
 * ほかの Finder ウィンドウも前に出るため（経緯と実測は docs/phase2-minimal-app/KNOWLEDGE.md）
 */
export async function openFolderOnMac(folder: string): Promise<string | undefined> {
  try {
    await run('osascript', ['-l', 'JavaScript', '-e', OPEN_FOLDER_SCRIPT, folder])
    return undefined
  } catch (e) {
    return (e as Error).message
  }
}
