import { Section } from '../parts'
import { Licenses } from '../Licenses'

/** ヘルプの章「ライセンス」 */
export function LicensesSection(): React.JSX.Element {
  return (
    <Section id="licenses" title="ライセンス">
      <Licenses />
    </Section>
  )
}
