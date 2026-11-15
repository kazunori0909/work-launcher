import type { LauncherApi } from '../core/ipc'

declare global {
  interface Window {
    launcher: LauncherApi
  }
}
