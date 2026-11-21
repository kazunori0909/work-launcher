import { CheatSheet, SampleView, Table } from '../../parts'
import { ELEMENT_CHEATS, EXAMPLES } from '../../examples'
import type { SectionProps } from '../../parts'

/** ヘルプの章「ボタン以外の要素」 */
export function Elements({ platform }: SectionProps): React.JSX.Element {
  return (
    <>
      <p>
        値を選ぶための部品です。選んだ値は、ほかのボタンのコマンドやパスに{' '}
        <code>{'${select:ID}'}</code> と書いて差し込みます。function からは{' '}
        <code>ctx.select.ID</code> で読めます。
      </p>
      <h3>早見表</h3>
      <CheatSheet cheats={ELEMENT_CHEATS} platform={platform} />

      <h3>選択（select）</h3>
      <p>
        ドロップダウンから1つ選びます。<code>{'${select:ID}'}</code> はコマンドのほか、
        <code>env</code>、パス、URL、<code>confirm</code>{' '}
        の文にも書けます。下の例では、接続先を選んでからデプロイのボタンを押します。
      </p>
      <SampleView example={EXAMPLES.select} platform={platform} />
      <Table
        head={['キー', '内容']}
        rows={[
          ['select', 'select の ID（英数字と - _）'],
          ['label', '選択肢の左に出す文字'],
          ['options', '選択肢。値だけか { label, value } を並べる'],
          ['default', '既定値（省略時は最初の選択肢）'],
          ['remember', 'true なら選んだ値を記憶し、開き直しても使う（省略時は記憶しない）']
        ]}
      />
      <p>
        記憶した値は、この PC
        のアプリの中に案件ごとに保存します。案件のファイルは書き換えないので、リポジトリに差分は出ません。同じ
        ID の select を別のページにも置くと、どちらも同じ値になります。
      </p>

      <h3>ラジオボタン（radio）</h3>
      <p>
        選択肢を横に並べて、1つを選びます。選択肢が少ないときは、ドロップダウンより一目でわかります。
        <code>select</code> を <code>radio</code> に変えるだけで、ほかの書き方も値の使い方も select
        と同じです。
      </p>
      <SampleView example={EXAMPLES.radio} platform={platform} />
      <Table
        head={['キー', '内容']}
        rows={[
          ['radio', 'ID（英数字と - _）'],
          ['label', '選択肢の左に出す文字'],
          ['options', '選択肢。値だけか { label, value } を並べる'],
          ['default', '既定値（省略時は最初の選択肢）'],
          ['remember', 'select と同じ']
        ]}
      />

      <h3>チェックボックス（checkbox）</h3>
      <p>
        オンとオフを切り替えます。それぞれのときに差し込む値を <code>on</code> と <code>off</code>{' '}
        に書きます。下の例では、チェックが入っているときだけ <code>--dry-run</code>{' '}
        を付けて実行します。
      </p>
      <SampleView example={EXAMPLES.checkbox} platform={platform} />
      <Table
        head={['キー', '内容']}
        rows={[
          ['checkbox', 'ID（英数字と - _）'],
          ['label', 'チェックの右に出す文字（省略時は ID）'],
          ['on', 'オンのときの値（省略時は true）'],
          ['off', "オフのときの値（省略時は false）。空にするなら ''"],
          ['default', 'true なら最初からオン（省略時はオフ）'],
          ['remember', 'select と同じ']
        ]}
      />
      <p>
        ID は select、radio、checkbox の3つで共通です。種類が違っても、同じ ID
        なら同じ値を指します。
      </p>
    </>
  )
}
