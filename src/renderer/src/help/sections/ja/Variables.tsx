import { t } from '../../../../../core/i18n'
import { Table } from '../../parts'
import type { SectionProps } from '../../parts'

/** ヘルプの章「変数」 */
export function Variables({ launcherDir, workDir }: SectionProps): React.JSX.Element {
  return (
    <>
      <p>パス、コマンド、URL の中に書くと、ボタンを押したときに実際の値に置き換わります。</p>
      <Table
        head={['書き方', '内容', 'いまの値']}
        rows={[
          [
            '${launcherDir}',
            'ランチャーのフォルダ（work.launcher があるフォルダ）',
            launcherDir ?? t().help.notOpen
          ],
          [
            '${workDir}',
            '作業フォルダ（cwd。書かなければランチャーのフォルダと同じ）',
            workDir ?? t().help.notOpen
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
        この表に無い <code>{'${...}'}</code> は置き換えずに残すので、sh の <code>{'${HOME}'}</code>{' '}
        などはそのまま書いてかまいません。
      </p>

      <p>
        <code>{'${workDir}'}</code>{' '}
        を変える方法と、そのとき何が変わるかは「設定ファイルの編集」の章にあります。
      </p>
    </>
  )
}
