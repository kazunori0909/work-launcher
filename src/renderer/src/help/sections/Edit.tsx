import { NOT_OPEN, Section, Table } from '../parts'
import type { SectionProps } from '../parts'

/** ヘルプの章「設定ファイルの編集」 */
export function Edit({ launcherDir, onError }: SectionProps): React.JSX.Element {
  const openFolder = async (): Promise<void> => {
    const r = await window.launcher.openProjectFolder()
    if (r.error) onError(r.error)
  }
  return (
    <Section id="edit" title="設定ファイルの編集">
      <p>
        設定ファイルは、ふだん使っているエディタで開いて編集します。いま開いているランチャーのフォルダはここです。
      </p>
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
        自分の PC だけで使いたいボタンは <code>launcher/config.local.yaml</code>{' '}
        に書きます。書き方は <code>config.yaml</code>{' '}
        と同じで、アプリは共通の設定にこのファイルを重ねて読みます。<code>.gitignore</code>{' '}
        に入れておけば、ほかの人の画面には出ません。
      </p>
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
          ['style・scripts', '共通の分の後ろに足す']
        ]}
      />
    </Section>
  )
}
