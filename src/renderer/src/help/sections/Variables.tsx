import { NOT_OPEN, Section, Table } from '../parts'
import type { SectionProps } from '../parts'

/** ヘルプの章「変数」 */
export function Variables({ launcherDir, workDir }: SectionProps): React.JSX.Element {
  return (
    <Section id="variables" title="変数">
      <p>パス、コマンド、URL の中に書くと、ボタンを押したときに実際の値に置き換わります。</p>
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
          [
            '${env:NAME}',
            '環境変数 NAME（無ければ空になり、コンソールに警告）',
            '押したときに決まる'
          ],
          [
            '${select:ID}',
            'select・radio・checkbox で選んでいる値（「ボタン以外の要素」の章）',
            '押したときに決まる'
          ],
          ['$${launcherDir}', '置き換えずに ${launcherDir} という文字のまま出す', '']
        ]}
      />
      <p>
        <code>{'${workDir}'}</code> のいまの値は、最上位の <code>cwd</code>{' '}
        から決めたものです。ページや項目に <code>cwd</code> を書けば、そこではそちらを使います。
      </p>
      <p>
        この表に無い <code>{'${...}'}</code> は置き換えずに残すので、sh の <code>{'${HOME}'}</code>{' '}
        などはそのまま書いてかまいません。
      </p>
      <p>
        相対パスはランチャーのフォルダから数えます。作業フォルダの下を開きたいときは{' '}
        <code>{'${workDir}/out'}</code> のように書きます。
      </p>
    </Section>
  )
}
