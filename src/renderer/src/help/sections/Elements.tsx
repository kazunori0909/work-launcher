import { CheatSheet, SampleView, Section, Table } from '../parts'
import { ELEMENT_CHEATS, EXAMPLES } from '../examples'
import type { SectionProps } from '../parts'

/** ヘルプの章「ボタン以外の要素」 */
export function Elements({ platform }: SectionProps): React.JSX.Element {
  return (
    <Section id="elements" title="ボタン以外の要素">
      <p>
        選んだ値は、ほかのボタンで <code>{'${select:ID}'}</code>、function では{' '}
        <code>ctx.select.ID</code> で使います。
      </p>
      <h3>早見表</h3>
      <CheatSheet cheats={ELEMENT_CHEATS} platform={platform} />

      <h3>選択（select）</h3>
      <p>
        選択肢を置き、選んだ値をほかのボタンで <code>{'${select:ID}'}</code>{' '}
        として使います（コマンド・<code>env</code>・パス・URL・<code>confirm</code>）。 function
        では <code>ctx.select.ID</code> で受け取ります。
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
        記憶した値は、この PC のアプリの中に案件ごとに置きます（案件のファイルには書きません）。
        同じ ID の select を別のページにも置くと、同じ値を共有します。
      </p>

      <h3>ラジオボタン（radio）</h3>
      <p>
        選択肢を横に並べ、1つを選びます。書き方は select と同じで、<code>select</code> の代わりに{' '}
        <code>radio</code> と書きます。値も select と同じく <code>{'${select:ID}'}</code>・
        <code>ctx.select.ID</code> で使います。
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
        オン・オフを切り替えます。それぞれのときの値を <code>on</code>・<code>off</code>{' '}
        に書き、select と同じく <code>{'${select:ID}'}</code>・<code>ctx.select.ID</code>{' '}
        で使います。
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
      <p>ID は select・radio・checkbox で共通です。種類が違っても、同じ ID は同じ値を指します。</p>
    </Section>
  )
}
