import { useContext } from 'react'
import { EmbedContext } from '../../../components/embedContext'
import { Callout, CheatSheet, Code, Fold, SampleView, Table } from '../../parts'
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

      <h3>Collapsible section (details)</h3>
      <p>
        Clicking the heading opens or closes the contents. Use it to tuck away explanations that
        need not always be shown, or buttons used only now and then. Write short text in{' '}
        <code>text</code>; to include buttons as well, list them in <code>items</code> as with
        group.
      </p>
      <SampleView example={EXAMPLES_EN.details} platform={platform} />
      <Table
        head={['Key', 'Meaning']}
        rows={[
          ['details', 'Heading'],
          ['text', 'Text shown inside (as written, line breaks kept)'],
          ['items', 'Items placed inside (details and group can go inside too)'],
          ['expanded', 'true shows it open (closed if omitted)'],
          ['frame', 'true draws a frame around it (no frame if omitted)']
        ]}
      />
      <p>
        If you write both <code>text</code> and <code>items</code>, the text comes first. The
        open/closed state is not remembered: reopening the page shows it as written.
      </p>

      <h3>Alerts (note, tip, important, warning, caution)</h3>
      <p>
        A colored box that makes a notice stand out. There are five kinds; the heading shows an icon
        and the name of the kind.
      </p>
      <SampleView example={EXAMPLES_EN.alert} platform={platform} />
      <p>
        The body is plain text, as written. To use bold or links, write a quote in <code>md</code>{' '}
        and put a marker such as <code>[!NOTE]</code> on its first line (<code>[!TIP]</code>,{' '}
        <code>[!IMPORTANT]</code>, <code>[!WARNING]</code>, <code>[!CAUTION]</code>). The same works
        inside md files.
      </p>
      <SampleView example={EXAMPLES_EN.alertMd} platform={platform} />

      <h3>Image (image)</h3>
      <p>
        Shows an image. Clicking it shows it large inside the window (close it with the close
        button, Esc, or by clicking the background).
      </p>
      <Code lang="yaml">{`- image: launcher/img/diagram.png
  width: 50%      # a number means px (width: 300); % is a share of the page width
  label: Diagram  # text shown if the image cannot be loaded (optional)
- image: launcher/img/logo.svg
  width: 96
  zoom: false     # do not enlarge on click`}</Code>
      <p>
        Images line up side by side like other items. Two images with <code>width: 50%</code> fit on
        one line. Without width, the image is shown at its own size. The same images as in md can be
        shown: files inside the launcher folder and <code>https</code> URLs.
      </p>

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
      <Callout kind="warning">
        Text containing <code>: </code> (a colon and a space) is read as a YAML key. As in the
        example above, write <code>|</code> and start the text on the next line.
      </Callout>
      <p>Clicking a link opens URLs in the browser and files in the default app.</p>
      <Fold title="How relative paths in links and images are counted">
        <p>
          Relative paths in links and images count from the launcher folder; only those in an md
          file count from that file&apos;s location. Images can be shown only from inside the
          launcher folder or from <code>https</code> URLs.
        </p>
      </Fold>

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
