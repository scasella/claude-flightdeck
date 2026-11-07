# Contributing

Issues and pull requests are welcome.

## Set up

```sh
git clone https://github.com/scasella/claude-flightdeck
cd claude-flightdeck
claude --plugin-dir .
```

Edits to `hooks/` hot-reload in that session when Claude's turn ends.

## Before a pull request

```sh
claude plugin validate .
claude plugin test .
npx -p typescript tsc -p .
```

All three must pass. The type check needs `.claude-plugin/types/`, which Claude Code writes the first time it loads the mod.

CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs the same three checks on every pull request and on each push to `main`. It also runs validate and the tests on the oldest Claude Code the README names, 2.1.289, where a prop or event that version lacks fails. To run that leg locally:

```sh
npx -y @anthropic-ai/claude-code@2.1.289 plugin test .
```

If a change needs a newer Claude Code, raise the floor in the README and in `ci.yml` together.

## Ground rules

- **Real data only.** Every number on the pane must come from a session event. If something is inferred, label it in the pane and in the README's "What is inferred" section.
- **Watch, don't act.** Hooks pass their events on unchanged; Flightdeck never denies, rewrites or delays anything.
- **Behaviour in `hooks/core.ts`.** Reducers and layout rules are pure functions with tests. `register.tsx` wires them to events and draws.
- **Narrow panes.** Check a drawing change at 24, 40, 64 and 120 columns. The pane draws at its real width down to 24, the narrowest dock Claude Code seats, and a test checks every width from 24 to 40 for anything that spills past its box.
- **One line, several colours: a row, not nested Texts.** Draw it with `line()` in `register.tsx`, pieces a gap apart. The desktop app wraps the pieces of a Text that nests Texts, and collapses runs of spaces, so a gap belongs to the Box, not the text. A test checks this on every surface.
- **No secrets in state.** Anything stored from a tool input goes through `redact()` first.

When you report a bug, include `claude --version` and any dim `flightdeck:` line from the transcript.
