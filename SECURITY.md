# Security Policy

## Supported versions

Only the latest release receives security fixes.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report it privately from the repository's **Security** tab → **Report a vulnerability**
(GitHub private vulnerability reporting). Include the steps to reproduce, the affected
version and OS, and what an attacker could do.

This is a personal project, so replies may take some time.

## Scope

WorkLauncher runs the commands written in a project's settings by design
(see [Security in the README](README.md#security)). Running commands from a project you
chose to open is not a vulnerability. Reports like these are welcome:

- a project runs something **without** the user's action or permission
  (for example, `scripts` running before the trust prompt)
- an embedded markdown / html page escapes its sandbox or reaches the app's internal APIs
- a release file that does not match its attestation or `SHA256SUMS.txt`
