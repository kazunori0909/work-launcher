import { Code, NOT_OPEN, Section, Table } from '../parts'
import type { SectionProps } from '../parts'

/** ヘルプの章「設定ファイルの編集」 */
export function Edit({ launcherDir, onError }: SectionProps): React.JSX.Element {
  const openFolder = async (): Promise<void> => {
    const r = await window.launcher.openProjectFolder()
    if (r.error) onError(r.error)
  }
  const createLocal = async (): Promise<void> => {
    const r = await window.launcher.createLocalConfig()
    if (r.error) onError(r.error)
  }
  return (
    <Section id="edit" title="設定ファイルの編集">
      <p>いま開いているランチャーのフォルダはここです。</p>
      <div className="help-row">
        <code>{launcherDir ?? NOT_OPEN}</code>
        {launcherDir && (
          <button className="item" onClick={openFolder}>
            フォルダを開く
          </button>
        )}
      </div>
      <p>
        保存すると、アプリが自動で読み直します。開いているタブや実行中のコマンドは止まりません。
      </p>

      <h3>自分だけの設定</h3>
      <p>
        ローカル環境でのみ使いたいボタンは <code>launcher/config.local.yaml</code>{' '}
        に書きます。書き方は <code>config.yaml</code>{' '}
        と同じで、アプリは共通の設定にこのファイルを重ねて読みます。<code>.gitignore</code>{' '}
        に入れておけば、ほかの人の画面には出ません。
      </p>
      {launcherDir && (
        <div className="help-row">
          <button className="item" onClick={createLocal}>
            config.local.yaml を作る
          </button>
        </div>
      )}
      <p>重ね方は、書いたものによって変わります。</p>
      <Table
        plain
        head={['ローカルに書いたもの', '結果']}
        rows={[
          ['共通と同じ ID のページ', 'そのページの最後に項目を足す'],
          ['同上に replace: true', 'そのページの項目を丸ごと置き換える'],
          ['共通と同じ id の項目', 'その項目を同じ位置で置き換える'],
          ['新しい ID のページ', '最後にページを足す'],
          ['title・cwd', '上書きする'],
          ['style・scripts', '共通の分の後ろに足す'],
          ['info の tools', '後ろに足す（同じ名前は上書き、hidden: true で出さない）']
        ]}
      />

      <h3>ページの追加</h3>
      <p>
        タブは <code>pages</code> に書いた順に並びます。<code>id</code> に使えるのは英数字と{' '}
        <code>-</code>、<code>_</code> です。<code>top</code>{' '}
        のページは、案件を開いたときに最初に出ます。
      </p>
      <p>
        ページが増えて <code>config.yaml</code> が長くなったら、<code>include</code>{' '}
        で別のファイルに分けられます。1つのファイルには1ページ分を書きます。
      </p>
      <Code lang="yaml">{`pages:
  - id: top
    title: メイン
    icon: house
    items: [...]
  - include: launcher/pages/tools.yaml

# launcher/pages/tools.yaml
id: tools
title: ツール
cwd: tools        # このページのコマンドを動かすフォルダ
items: [...]`}</Code>
      <p>
        <code>help</code> という ID は、このヘルプのために取ってあります。<code>pages</code> に{' '}
        <code>id: help</code>{' '}
        のページを書くと、その項目がヘルプのいちばん上の章に出ます。章の名前は案件の{' '}
        <code>title</code> です。案件ならではの手順やメモを置く場所に使えます。
      </p>

      <h3>作業フォルダを変える（cwd）</h3>
      <p>
        <code>config.yaml</code> の最上位に <code>cwd</code> を書くと、作業フォルダ（
        <code>{'${workDir}'}</code>）が変わります。ランチャーを案件の外に置くときに使います。
      </p>
      <Code>{`root/
  work-launcher/          ← \${launcherDir}（ランチャーのフォルダ）
    work.launcher
    launcher/
      config.yaml         ← cwd: ../project-hoge
      notes/setup.md
  project-hoge/           ← \${workDir}（作業フォルダ）
    bat/hoge.bat
    docs/spec.xlsx`}</Code>
      <Table
        plain
        head={['書く場所', '数え始める所', '上の例では']}
        rows={[
          ['コマンド（bat・sh など）', '作業フォルダ', 'project-hoge/'],
          ['open・excel・word・powerpoint', '作業フォルダ', 'project-hoge/'],
          ['md・style・scripts・include', 'ランチャーのフォルダ', 'work-launcher/（変わらない）'],
          ['cwd そのもの', 'ランチャーのフォルダ', 'work-launcher/（変わらない）']
        ]}
      />
      <Code lang="yaml">{`cwd: ../project-hoge
pages:
  - id: main
    items:
      - bat: bat\\hoge.bat              # project-hoge/bat/hoge.bat
      - excel: docs/spec.xlsx          # project-hoge/docs/spec.xlsx
      - md: launcher/notes/setup.md    # work-launcher/launcher/notes/setup.md
      - open: \${launcherDir}/launcher  # ランチャーの中を開くときは明示する`}</Code>
      <p>
        <code>cwd</code> を書かなければ、2つは同じフォルダなので違いはありません。ページや項目に{' '}
        <code>cwd</code> を書くと、そこではそちらが作業フォルダになります。
      </p>
    </Section>
  )
}
