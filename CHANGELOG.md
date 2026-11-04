# Changelog

## Unreleased

- Under a Team or Enterprise login, or on a machine with managed settings, the session no longer shows `flightdeck: its session.append hook was skipped`. The hook now takes only the response rows it reads, not the attachment, hook-context and compaction rows that Claude Code's built-in guard keeps from user plugins. ([#21](https://github.com/scasella/claude-flightdeck/pull/21), thanks @jeanfbrito; [#23](https://github.com/scasella/claude-flightdeck/issues/23), thanks @guglielmo)
- README: Troubleshooting says what that guard costs Flightdeck. It never runs a user plugin's `classic.*` or `session.compact` hooks, so the permission mode shows only from a subagent's start. ([#23](https://github.com/scasella/claude-flightdeck/issues/23))
- Under that guard, compactions are estimated rather than left at zero. Claude Code reports no context fill until the first response after a compaction, so a main-loop request that finds none after a response came back counts as one. The main box marks the count `⟲~`, with `(estimated)` when there's room, and the log says `context compacted (estimated)`. Wherever `session.compact` runs, its count replaces the estimate. A rewind to the first prompt also counts. ([#23](https://github.com/scasella/claude-flightdeck/issues/23), thanks @guglielmo)
- A compaction that comes back skipped, vetoed by a plugin or a blocking `PreCompact` hook, is no longer counted in `⟲` or logged as `context compacted`: the conversation stays as it was.

## 0.5.1

- The main box's `last req` line shows only the time to first token. Its tokens per second divided the reported output tokens, which include thinking, by the time from the first streamed piece, so when thinking wasn't streamed it read thousands of tokens a second. It is gone rather than wrong. ([#19](https://github.com/scasella/claude-flightdeck/pull/19))
- On the desktop app the connector between panels no longer jitters at its right end while work runs. It is drawn in the surface's monospaced face, where its dashes and moving dot are each one cell, and clipped at its width. In a terminal it looks the same. ([#19](https://github.com/scasella/claude-flightdeck/pull/19))

## 0.5.0

- The context gauge, its `tokens/window` and the status line's `ctx N%` measure against the compaction window when the session compacts in a smaller one than the model's, whether `autoCompactWindow` (global or per model) or Claude Code sets it. Auto-compaction runs a little before 100%, and the figure reads higher than Claude Code's own status-line percentage, which measures against the model's window. The window comes from a local `summary` breakdown (no request sent), read once per model. ([#9](https://github.com/scasella/claude-flightdeck/issues/9), thanks @DrWBlow)
- A subagent resumed with `SendMessage` runs again on its card: ◐ running from its next request, `resumed` in the log, and counted in the status line's `agents N/M`. Its clock still counts from the first spawn; the log's `done · …` times each run. A second spawn under the same id resumes the card rather than adding another. ([#8](https://github.com/scasella/claude-flightdeck/issues/8), thanks @momchilon; [#12](https://github.com/scasella/claude-flightdeck/pull/12), thanks @Alendro305)
- A subagent's turn start no longer logs its prompt as yours or resets the main turn's receipt.
- `paneColumns` sets the width the docked pane asks for (default 66, at least 40; Claude Code caps the dock at 45% of the terminal). ([#6](https://github.com/scasella/claude-flightdeck/issues/6), thanks @matheusmaais)
- The pane draws at its real width down to 24 columns, the narrowest dock Claude Code seats, instead of never narrower than 40, so a narrow desktop pane or terminal dock no longer has the right side of every box cut off. Below 40 columns the agents header, the lanes, other loops and the session log take shorter forms, and the gate's file, shell and other buttons wrap. From 40 columns up the pane draws as before.
- On the desktop app, lines of several colours stay on one line. They are rows of pieces a gap apart, as the session log's lines are, rather than nested Texts the desktop app wrapped; a piece that doesn't fit is left out, and the gate's totals fall back to numbers alone. In a terminal these lines read as before wherever they fit.
- On graphical surfaces (desktop, VS Code, mobile) the gate strip and the other rows of marks hold fewer marks, since a mark draws wider than a cell there, and still end on the newest; the legend keeps a row of air above the panels; the agents' time axis scales down to a narrow pane. ([#10](https://github.com/scasella/claude-flightdeck/pull/10), thanks @bhpdev1; also found in [#11](https://github.com/scasella/claude-flightdeck/pull/11) by @darrentmorgan)
- A draw that fails shows `draw failed (…)` in the pane instead of an empty box, and a surface module that faults, such as the cut-off `flightdeck: Client hooks/rail.tsx: …` line in the desktop app, is drawn as plain text on that surface while the rest keeps animating. ([#12](https://github.com/scasella/claude-flightdeck/pull/12), thanks @Alendro305; [#7](https://github.com/scasella/claude-flightdeck/issues/7), thanks @NathanAB)
- README: the `pluginConfigs` key is the plugin's id, `flightdeck@claude-flightdeck` when installed and `flightdeck` with `--plugin-dir`, and project settings aren't read ([#13](https://github.com/scasella/claude-flightdeck/issues/13), thanks @jangerhard). Troubleshooting notes that the VS Code extension may show no mod pane yet ([#5](https://github.com/scasella/claude-flightdeck/issues/5), thanks @jonathon-lawlor798). A statuslin.es badge ([#7](https://github.com/scasella/claude-flightdeck/issues/7)).
- CI runs `claude plugin validate`, the tests and `tsc` on every pull request and on `main`.

## 0.4.0

- The main box shows the time left until each rate-limit window resets (`5h ▰▱▱▱▱ 19% ↻3h10m`), from the `resetsAt` the session already reports. Below 56 columns the gauges stay as they were. ([#3](https://github.com/scasella/claude-flightdeck/pull/3), thanks @vihrea1337)
- The main box shows the last main-loop request's time to first token and decode speed (`last req  ttft 0.8s · 60 tok/s`), timed as its response streams past. ([#1](https://github.com/scasella/claude-flightdeck/issues/1))
- The session log has a one-row gap above it, in both layouts. ([#2](https://github.com/scasella/claude-flightdeck/issues/2))

## 0.3.2

- A background architect's advice is read from its `SubagentHandback` tool call, where the report actually arrives, with the hand-back text as a fallback. Bold markers no longer leak into the advice line.
- README: no longer promises that counters survive every update; a change to the state's shape may reset them once.

## 0.3.1

- The main box shows the model and effort as soon as a request starts, not after the first one finishes.
- Advice from a background architect agent (such as `fable-advisor`) now reaches the architect's `»` line; it arrives as a hand-back message, not as the agent's own answer.
- New README media showing the Flightdeck header; plainer wording about opening on start.
- More gate tests (24 in all).

## 0.3.0

First public release.

- Panels: main vitals (context, compactions, cost, rate limits), architect timeline, permission gate strip with per-family drill-down, agent cards and swimlanes, other loops, turn receipt, session log.
- Layouts: docked one- or two-column, and an 8-row inline summary for the main screen. Cards fall back to swimlanes when they don't fit.
- Theme colours by default, with a `pastel` palette option.
- Animated connectors and live clocks as surface modules, only while work flows.
- Works on the terminal, desktop app, VS Code and mobile surfaces.
- Config for the architect pattern, labels, panels, layout, card limit, motion, moments, palette, opening on start and the status line.
- `/clear` and `/flightdeck reset` start the pane fresh; reads tolerate missing or older fields.
