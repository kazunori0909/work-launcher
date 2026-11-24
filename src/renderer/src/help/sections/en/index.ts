import type { HelpGroup } from '../book'
import { ConsoleColors } from './ConsoleColors'
import { Disable } from './Disable'
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
import { SetValues } from './SetValues'
import { Start } from './Start'
import { Variables } from './Variables'

/** 英語のヘルプの章の一覧（ID と並びは ja/index.ts に合わせる） */
export const HELP_EN: readonly HelpGroup[] = [
  {
    label: 'Start here',
    sections: [
      { id: 'start', title: 'Getting started', Body: Start },
      { id: 'variables', title: 'Variables', Body: Variables },
      { id: 'edit', title: 'Editing the settings', Body: Edit },
      { id: 'errors', title: 'When errors appear', Body: Errors },
      { id: 'licenses', title: 'Licenses', Body: LicensesSection }
    ]
  },
  {
    label: 'Adding elements',
    sections: [
      { id: 'items', title: 'Adding buttons', Body: Items },
      { id: 'elements', title: 'Other elements', Body: Elements },
      { id: 'display', title: 'Layout and decoration', Body: Display },
      { id: 'functions', title: 'Calling from functions', Body: Functions }
    ]
  },
  {
    label: 'Changing elements',
    sections: [
      { id: 'disable', title: 'Disabling elements', Body: Disable },
      { id: 'set-values', title: 'Changing values', Body: SetValues }
    ]
  },
  {
    label: 'Settings',
    sections: [
      { id: 'events', title: 'Events', Body: Events },
      { id: 'console', title: 'Console colors', Body: ConsoleColors },
      { id: 'info', title: 'Info page', Body: Info },
      { id: 'look', title: 'Title and look', Body: Look }
    ]
  }
]
