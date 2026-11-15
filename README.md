# WorkLauncher

A desktop launcher for your daily work, for Windows and macOS.
Put `launcher/config.yaml` in a repository to define pages and buttons that run
commands (bat / sh / PowerShell / Python), open files and folders, open URLs, or call
JavaScript functions. Personal overrides go in `launcher/config.local.yaml`.
An empty `work.launcher` file next to it opens the project with a double-click.

- Configuration spec: [docs/config.md](docs/config.md) (Japanese)
- Built-in help: the last tab in the app

## Install

Download from the [Releases](../../releases) page.

| File                                              | For                                       |
| ------------------------------------------------- | ----------------------------------------- |
| `work-launcher-<ver>-win-x64-setup.exe`           | Windows installer                         |
| `work-launcher-<ver>-win-x64-portable.exe`        | Windows, no install (commit it to a repo) |
| `work-launcher-<ver>-mac-apple-silicon-arm64.dmg` | Mac with Apple Silicon (M1 or later)      |
| `work-launcher-<ver>-mac-intel-x64.dmg`           | Mac with Intel                            |
| `work-launcher-sample-<ver>.zip`                  | Sample project to start from              |

Not sure which Mac you have? Open **Apple menu > About This Mac**: if it shows **Chip: Apple M…**,
use Apple Silicon; if it shows **Processor: … Intel …**, use Intel.

The installed app opens a project by double-clicking its `work.launcher`, dropping it on the
app icon, or File > Open Project (Cmd+O / Ctrl+O).

To try the sample, unzip `work-launcher-sample-<ver>.zip` and double-click `sample/work.launcher`
(or put the portable exe next to it and run the exe). Edit `sample/launcher/config.yaml` and save;
the window updates right away. See the Help tab in the app for how to write it.

The apps are not code-signed, so the OS warns on first launch:

- **Windows**: "Windows protected your PC" → **More info** → **Run anyway**
- **macOS**: "Apple could not verify…" → open **System Settings > Privacy & Security**, scroll down,
  and click **Open Anyway** for WorkLauncher (needed once)

## Security

WorkLauncher is meant for personal and team use. It assumes that you write your own
`config.local.yaml`, and that the shared `launcher/` settings come from people you trust
(for example, reviewed in your team's repository).

**Opening a project means trusting it.** The settings can run anything on your PC:

- `exec` buttons (bat / sh / PowerShell / Python) run as soon as you click them
- `command` in `info.tools` runs in a shell when you open the Info tab
- `open` items can open any file (including programs)
- `url` items and links open only the URL schemes listed in `openSchemes`
  (default: `http`, `https`, `mailto`). Adding `file` lets them open local and shared files too
- `scripts` (JavaScript) asks once per project folder before running; after you allow it,
  it is not asked again even if the files change

Do not open projects from unknown sources. Review changes to `launcher/` as you would review
code, especially in shared folders that others can edit.

WorkLauncher sends nothing to the internet by itself (no telemetry, no automatic updates).
Network access happens only when:

- a markdown / html embed shows an image from an `https://` URL (loaded when the page is shown)
- you click a link or a `url` item (it opens in your browser)
- your own commands and scripts access the network

## Development

Requires Node.js 24 (pinned with [mise](https://mise.jdx.dev/) in `mise.toml`).

```bash
npm install
npm run dev     # opens examples/sample
npm test
npm run build
```

## Release

`main` is protected: changes go through a pull request, and CI (lint, typecheck and test on
Windows and macOS) must pass before merging. Only the admin can push `v*` tags.

1. On a branch, bump `version` in `package.json` (e.g. `0.1.0`), open a pull request and merge it
2. `git tag -a v0.1.0 -m v0.1.0 && git push origin v0.1.0` (an annotated tag, so the tag page
   shows the version instead of the last commit message)
3. GitHub Actions builds on Windows and macOS and creates a **draft** release with the files
   (the tag must match `package.json`)
4. Check the draft on the Releases page, edit the notes, and click **Publish release**.
   Published releases cannot be changed (immutable releases)

To build without releasing, run the **Release** workflow manually from the Actions tab;
the files are attached to the run as artifacts.

### Verifying a download

The files are not code-signed. Each release has `SHA256SUMS.txt` and a build provenance
attestation, which shows that the file was built by this repository's workflow:

```bash
gh attestation verify work-launcher-0.1.0-win-x64-setup.exe -R kazunori0909/work-launcher
```

To report a security problem, see [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE). The licenses of the bundled libraries are listed in the app
(Help > ライセンス) and collected at build time by `scripts/licenses.mjs`.
