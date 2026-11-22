import type { Lang } from '../../../src/core/i18n'
import { EXAMPLES } from '../../../src/renderer/src/help/examples'
import { EXAMPLES_EN } from '../../../src/renderer/src/help/examples.en'
import { SampleView } from '../../../src/renderer/src/help/parts'
import { WebHelp } from './WebHelp'

const BOOKS = { ja: EXAMPLES, en: EXAMPLES_EN }

/** トップに置く、ヘルプの見本（押すと実行する内容が出る） */
export function LiveSample({
  lang,
  example
}: {
  lang: Lang
  example: keyof typeof EXAMPLES
}): React.JSX.Element {
  return (
    <WebHelp lang={lang}>
      <div className="help">
        <SampleView example={BOOKS[lang][example]} platform="darwin" />
      </div>
    </WebHelp>
  )
}
