import { NOT_OPEN, Section, Table } from '../parts'
import type { SectionProps } from '../parts'

/** ヘルプの章「変数」 */
export function Variables({ launcherDir, workDir }: SectionProps): React.JSX.Element {
  return (
    <Section id="variables" title="変数">
      <p>パス・コマンド・URL の中で使えます。</p>
      <Table
        head={['書き方', '内容', 'いまの値']}
        rows={[
          [
            '${launcherDir}',
            'ランチャーのフォルダ（work.launcher があるフォルダ）',
            launcherDir ?? NOT_OPEN
          ],
          [
            '${workDir}',
            '作業フォルダ（cwd。書かなければランチャーのフォルダと同じ）',
            workDir ?? NOT_OPEN
          ],
          ['${env:NAME}', '環境変数 NAME（無ければ空になり、コンソールに警告）', '―'],
          [
            '${select:ID}',
            'select・radio・checkbox で選んでいる値（「ボタン以外の要素」の章）',
            '―'
          ],
          ['$${launcherDir}', '置き換えずにそのまま ${launcherDir} と書く', '―']
        ]}
      />
      <p>
        <code>{'${workDir}'}</code> のいまの値は、最上位の <code>cwd</code>{' '}
        から決めたものです。ページや項目で <code>cwd</code> を書くと、そちらになります。
      </p>
      <p>
        ほかの <code>{'${...}'}</code> はそのまま残すので、sh の <code>{'${HOME}'}</code>{' '}
        などとぶつかりません。相対パスはランチャーのフォルダから数えます。作業フォルダの下を開くときは{' '}
        <code>{'${workDir}/out'}</code> のように書きます。
      </p>
    </Section>
  )
}
