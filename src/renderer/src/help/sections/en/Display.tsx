import { useContext } from 'react'
import { EmbedContext } from '../../../components/embedContext'
import { CheatSheet, Code, SampleView, Table } from '../../parts'
import { EXAMPLES_EN, LAYOUT_CHEATS_EN } from '../../examples.en'
import { IconBrowser } from '../../IconBrowser'
import type { SectionProps } from '../../parts'

/** ヘルプの章「レイアウトと装飾」（英語） */
export function Display({ platform }: SectionProps): React.JSX.Element {
  const { onLink } = useContext(EmbedContext)
  return (
    <>
      <h3>Cheat sheet</h3>
      <CheatSheet cheats={LAYOUT_CHEATS_EN} platform={platform} />

      <h3>Line breaks and headings (break / heading)</h3>
      <p>
        Buttons line up side by side and wrap when there is no more room. Write <code>break</code>{' '}
        to break the line where you like, and <code>heading</code> to add a heading between groups.
      </p>
      <SampleView example={EXAMPLES_EN.layout} platform={platform} />

      <h3>Group (group)</h3>
      <p>
        Draws a frame around the items listed in <code>items</code>. The value of <code>group</code>{' '}
        becomes the frame&apos;s heading; write just <code>group:</code> for a frame without a
        heading. A group cannot contain another group.
      </p>
      <SampleView example={EXAMPLES_EN.group} platform={platform} />

      <h3>Button group (buttons)</h3>
      <p>
        Joins several buttons with no gap so they look like one block. A common use is a small edit
        button next to a button that opens a file read-only. <code>label: &apos;&apos;</code> makes
        an icon-only button. Only buttons can go inside.
      </p>
      <SampleView example={EXAMPLES_EN.buttons} platform={platform} />

      <h3>Writing text (md / html)</h3>
      <p>
        Shows text in place instead of a button, for things like notes before a task. In{' '}
        <code>md</code>, write Markdown directly or the path of an md file. A{' '}
        <code>&lt;script&gt;</code> written in <code>html</code> does not run.
      </p>
      <SampleView example={EXAMPLES_EN.embed} platform={platform} />
      <Code lang="yaml">{`- md: launcher/notes/release.md   # one line ending in .md reads the file`}</Code>
      <p>
        Only a single-line value ending in <code>.md</code> is read as a file path. Anything else is
        treated as the text itself.
      </p>
      <p>
        Relative paths in links and images count from the launcher folder; only those in an md file
        count from that file&apos;s location. Clicking a link opens URLs in the browser and files in
        the default app. Images can be shown only from inside the launcher folder.
      </p>
      <p>
        A common pitfall is text containing <code>: </code> (a colon and a space). Text like{' '}
        <code>color: red</code> written on the same line is read as a YAML key. As in the example
        above, write <code>|</code> and start the text on the next line.
      </p>

      <h3>Icons (icon)</h3>
      <p>
        Write a name from{' '}
        <a
          href="https://lucide.dev/icons/"
          onClick={(e) => {
            e.preventDefault()
            onLink(e.currentTarget.href, '')
          }}
        >
          Lucide
        </a>{' '}
        (an open-source icon set) in <code>icon</code>. Search the list below and click an icon to
        copy <code>icon: name</code>. A name that does not exist shows a warning at the top of the
        window.
      </p>
      <Table
        head={['Kind', 'Icon when not written']}
        rows={[
          ['bat, sh, powershell, python', 'terminal'],
          ['url', 'globe'],
          ['open', 'file (with an extension), folder-open'],
          ['function', 'code']
        ]}
      />
      <p>
        To remove the icon, write <code>icon: &quot;&quot;</code>.
      </p>
      <IconBrowser />
    </>
  )
}
