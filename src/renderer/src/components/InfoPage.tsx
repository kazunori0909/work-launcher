import { useCallback, useContext, useEffect, useState } from 'react'
import {
  driveLabel,
  infoSections,
  infoText,
  sectionText,
  systemGroups,
  toolVersionLabel,
  VULN_INFO_URL
} from '../../../core/info'
import type { InfoSection, InfoSectionKey, SystemInfo } from '../../../core/info'
import { EmbedContext } from './embedContext'
import { Icon } from './Icon'
import { t } from '../../../core/i18n'

/** PC の情報。タブを開いたときと「更新」で取り直す */
export function InfoPage(): React.JSX.Element {
  const [info, setInfo] = useState<SystemInfo>()
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const fetchInfo = useCallback(
    () =>
      window.launcher
        .getInfo()
        .then(setInfo)
        .finally(() => setLoading(false)),
    []
  )

  // タブを開いたとき（loading の初期値は true）
  useEffect(() => {
    fetchInfo()
  }, [fetchInfo])

  const load = (): void => {
    setLoading(true)
    fetchInfo()
  }

  const copy = async (): Promise<void> => {
    if (!info) return
    await navigator.clipboard.writeText(infoText(info))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="info">
      <div className="info-actions">
        <button className="item" onClick={load} disabled={loading}>
          <Icon name="refresh-cw" />
          {loading ? t().info.loading : t().info.refresh}
        </button>
        <button className="item" onClick={copy} disabled={!info}>
          <Icon name={copied ? 'check' : 'copy'} />
          {copied ? t().info.copied : t().info.copyText}
        </button>
      </div>
      {info && <InfoView info={info} />}
    </div>
  )
}

/** 空の枠のヒント。コードの前後の文言は言語ごとに辞書で持つ */
function Hint({
  text: [before, after],
  code
}: {
  text: string[]
  code: string
}): React.JSX.Element {
  return (
    <>
      {before} <code>{code}</code> {after}
    </>
  )
}

/** 短い表（システム・ツール）は横に並べ、件数が増えるもの（ドライブ・環境変数）は幅いっぱいに出す */
function InfoView({ info }: { info: SystemInfo }): React.JSX.Element {
  const sections = new Map(infoSections(info).map((s) => [s.key, s]))
  const head = (key: InfoSectionKey): React.JSX.Element => <CardHead section={sections.get(key)!} />
  return (
    <>
      {info.problems.map((p) => (
        <p key={p} className="info-note">
          {p}
        </p>
      ))}
      <div className="info-grid">
        {systemGroups(info).map((group) => (
          <section key={group.key} className="info-card">
            {head(group.key)}
            <Rows
              rows={group.rows.map((r): Row => [r.label, r.sub ? `${r.value}\n${r.sub}` : r.value])}
            />
          </section>
        ))}

        <section className="info-card">
          {head('tools')}
          {info.tools.length === 0 ? (
            <p className="info-hint">
              <Hint text={t().info.toolsHint} code="info.tools" />
            </p>
          ) : (
            <Rows
              rows={info.tools.map((tool): Row => [tool.name, tool.version])}
              missing={(i) => toolVersionLabel(info.tools[i])}
            />
          )}
          <VulnLink />
        </section>

        {info.drives.length > 0 && (
          <section className="info-card wide">
            {head('drives')}
            <div className="drives">
              {info.drives.map((d) => (
                <div key={d.mountPoint} className="drive" title={d.mountPoint}>
                  <div className="drive-name">
                    <Icon name={d.network ? 'network' : 'hard-drive'} />
                    {d.name}
                  </div>
                  <UsageBar drive={d} />
                  <div className="drive-size">{driveLabel(d)}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="info-card wide">
          {head('env')}
          {info.env.length === 0 ? (
            <p className="info-hint">
              <Hint text={t().info.envHint} code="info.env" />
            </p>
          ) : (
            <Rows
              rows={info.env.map((e): [string, string | undefined] => [
                e.name,
                e.value === undefined ? undefined : splitPathList(e.name, e.value)
              ])}
              missing={t().notSet}
              mono
            />
          )}
        </section>

        {info.registry && (
          <section className="info-card wide">
            {head('registry')}
            {info.registry.length === 0 ? (
              <p className="info-hint">
                <Hint text={t().info.registryHint} code="info.registry" />
              </p>
            ) : (
              <Rows
                rows={info.registry.map((r): Row => [r.name, r.value, r.path])}
                missing={t().notSet}
                mono
              />
            )}
          </section>
        )}
      </div>
    </>
  )
}

/** 脆弱性の情報のサイトへのリンク。開き方は md のリンクと同じ（openSchemes を確かめて既定のブラウザ） */
function VulnLink(): React.JSX.Element {
  const { onLink } = useContext(EmbedContext)
  return (
    <p className="info-link">
      <a
        href={VULN_INFO_URL}
        onClick={(e) => {
          e.preventDefault()
          onLink(VULN_INFO_URL, '')
        }}
      >
        <Icon name="external-link" size={14} />
        {t().info.vulnLink}
      </a>
    </p>
  )
}

/** 枠の見出しと、その枠だけをコピーするボタン（右上） */
function CardHead({ section }: { section: InfoSection }): React.JSX.Element {
  const [copied, setCopied] = useState(false)
  const copy = async (): Promise<void> => {
    await navigator.clipboard.writeText(sectionText(section))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <div className="info-card-head">
      <h2>{section.title}</h2>
      {section.lines.length > 0 && (
        <button
          className="info-copy"
          onClick={copy}
          title={copied ? t().info.copied : t().info.copySection(section.title)}
          aria-label={t().info.copySection(section.title)}
        >
          <Icon name={copied ? 'check' : 'copy'} size={14} />
        </button>
      )}
    </div>
  )
}

/** PATH のような一覧は1行に1つずつ出す */
function splitPathList(name: string, value: string): string {
  if (!/^(path|pathext)$/i.test(name)) return value
  return value.split(value.includes(';') ? ';' : ':').join('\n')
}

/** 名前・値・（あれば）補足。補足は3列目に控えめに出す（レジストリのパスなど） */
type Row = [string, string | undefined, string?]

function Rows({
  rows,
  missing,
  mono
}: {
  rows: Row[]
  /** 値が無い行に出す文言。行ごとに変えるときは関数で渡す */
  missing?: string | ((index: number) => string)
  mono?: boolean
}): React.JSX.Element {
  return (
    <div className="table-wrap">
      <table className="info-table">
        <tbody>
          {rows.map(([name, value, note], i) => (
            <tr key={`${name}-${i}`}>
              <th>{name}</th>
              <td className={value === undefined ? 'missing' : mono ? 'mono' : undefined}>
                {value === undefined ? (
                  typeof missing === 'function' ? (
                    missing(i)
                  ) : (
                    missing
                  )
                ) : mono ? (
                  value
                ) : (
                  <WithDetail text={value} />
                )}
              </td>
              {note !== undefined && <td className="note">{note}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** 2行目以降は補足として控えめに出す（メモリの内訳など） */
function WithDetail({ text }: { text: string }): React.JSX.Element {
  const [first, ...rest] = text.split('\n')
  return (
    <>
      {first}
      {rest.length > 0 && <span className="detail">{'\n' + rest.join('\n')}</span>}
    </>
  )
}

function UsageBar({ drive }: { drive: SystemInfo['drives'][number] }): React.JSX.Element | null {
  if (!drive.totalBytes || drive.freeBytes === undefined) return null
  const used = 1 - drive.freeBytes / drive.totalBytes
  return (
    <span className="usage" aria-hidden>
      <span style={{ width: `${Math.round(used * 100)}%` }} className={used > 0.9 ? 'high' : ''} />
    </span>
  )
}
