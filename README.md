# Flightdeck

[![Release](https://img.shields.io/github/v/release/scasella/claude-flightdeck)](https://github.com/scasella/claude-flightdeck/releases/latest)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Claude Code 2.1.287+](https://img.shields.io/badge/Claude%20Code-2.1.287%2B%20mod-d97757.svg)](https://claude.com/blog/claude-code-mods)
[![Listed on statuslin.es](https://img.shields.io/badge/listed%20on-statuslin.es-c96442)](https://statuslin.es/mods/flightdeck)

**A Claude Code mod that puts a live agent dashboard in your terminal**: context and cost, an advisor timeline, every permission check, and your subagents as cards or swimlanes. Every number comes from a real session event, and nothing leaves your machine.

<p align="center">
  <img src="docs/media/demo.gif" alt="Flightdeck during a live session: five audit subagents fan out as cards, switch to swimlanes and finish, while the permission gate fills with checks" width="520">
</p>

<p align="center">
  <a href="#install">Install</a> · <a href="#what-you-see">What you see</a> · <a href="#what-it-can-reach">What it can reach</a> · <a href="#configure">Configure</a> · <a href="#troubleshooting">Troubleshooting</a> · <a href="CHANGELOG.md">What's new</a>
</p>

## Install

Inside Claude Code (2.1.287 or later):

```
/plugin marketplace add scasella/claude-flightdeck
/plugin install flightdeck@claude-flightdeck
/reload-plugins
/flightdeck
```

<details>
<summary><strong>From the terminal, or from a clone</strong></summary>

```sh
claude plugin marketplace add scasella/claude-flightdeck
claude plugin install flightdeck@claude-flightdeck
```

Or load it straight from a clone, for one session:

```sh
git clone https://github.com/scasella/claude-flightdeck
claude --plugin-dir ./claude-flightdeck
```

</details>

The installer may say config options aren't set; the defaults are fine, and [`/config`](#configure) changes them.

Mods are an early-access Claude Code feature and their API can change between releases. If something breaks, see [Troubleshooting](#troubleshooting).

## What you see

https://github.com/user-attachments/assets/9ad0fcc3-c81c-427a-a743-f7b6c49f5885

<p align="center">
  <img src="docs/media/docked-session.png" alt="Claude Code in fullscreen with the Flightdeck pane docked beside the transcript" width="820">
</p>

| Docked beside the transcript | Inline above the prompt |
| --- | --- |
| <img src="docs/media/docked-pane.png" alt="The docked pane: main model vitals, architect timeline, permission gate, five agents as swimlanes, last-turn receipt and session log" width="380"> | <img src="docs/media/inline-mini.png" alt="The inline mini layout: the model, context gauge, session cost and architect consults; the permission gate strip and totals; the last turn's duration, agents, edits, errors and cost" width="420"><br><br>On the main screen, without fullscreen, the pane is a summary of at most 8 rows; up to 3 agents join it when the session has subagents. |

| Panel | Shows | From |
| --- | --- | --- |
| **main** | model, effort, permission mode, request count; a context gauge with compactions (⟲, or ⟲~ when [estimated](#what-is-inferred-not-measured)), measured against the compaction window when the session compacts in a smaller one than the model's (`autoCompactWindow`, or Claude Code's own); cost and the first two rate-limit windows when your plan reports them, with the time to each reset (↻) from 56 columns; the last main-loop request's time to first token | `turn.step`, `session.measure`, `session.compact`, `$.session.usage()` (at each main-loop request, and its local `summary` breakdown, once per model, for the compaction window); the permission mode from `classic.UserPromptSubmit` and `agent.spawn` |
| **architect** | consults on a timeline, whether one is running, how long the last took; optionally the moment of each consult; the first line of a subagent architect's advice | a spawn of a matching agent type, or a matching server tool in the assistant's rows |
| **gate** | one cell per permission check: green allowed without asking, blue decided by the auto-mode classifier or you and then run, amber pending, red ✗ denied, dim if made inside a subagent. Totals, and a drill-down per tool family with credentials masked | `tool.check`, settled by the `tool.call` around it |
| **agents** | cards side by side while they fit: the task, type, live context and output tokens, steps, a running clock, `max_tokens` in red. Beyond that, swimlanes on one time axis | `agent.spawn`, `turn.step`, `tool.call`, `turn.complete` |
| **loops** | model loops that match no card: workflow agents, compactions, memory forks | `turn.step` ids no card claims |
| **receipt** | the running turn, or the last one: duration, agents, edits, errors, cost added | `turn.start`, `turn.complete` |
| **log** | prompts, spawns, completions, consults, edits, errors and denials; filtered to one agent while you view its transcript | all of the above |

Connectors animate only while work flows: a turn is running, an agent is running, or a consult is open. Panels with nothing to show take no room, so a session without subagents shows just the main box and the log.

## Use

| Command | Does |
| --- | --- |
| `/flightdeck` | open the pane |
| `/flightdeck close` | close it |
| `/flightdeck reset` | clear agents, checks, consults, log and the turn (cost, rate limits and compactions stay) |
| `/flightdeck layout auto\|compact\|wide\|mini` | override the layout for this session |

Focus the pane with `ctrl+x tab`, then:

| Key | Does |
| --- | --- |
| `1`, `2`, … | expand an agent card or lane: its full task, last 3 tool calls, start of its answer |
| `f` `s` `o` | open the gate's file / shell / other drill-down: the last 5 checks and their verdicts |

`/clear` resets the pane along with the conversation.

## Where it runs

- **Fullscreen terminal:** docked beside the transcript; two columns from 110 columns wide.
- **Main-screen terminal:** inline above the prompt, as the 8-row summary.
- **Desktop app, VS Code, mobile:** the same panels, plus the agents drawn as an SVG time axis. VS Code and mobile can't animate, so connectors and clocks are static there. (The VS Code extension may show no pane at all yet: see [Troubleshooting](#troubleshooting).)

With `openOnStart`, the pane opens by itself when a session starts, in terminals at least 144 columns wide; below that, `/flightdeck` opens it. Colours come from your Claude Code theme, so light, dark and colour-blind themes all read.

## What it can reach

Flightdeck only watches. Every hook passes its event on unchanged: it never denies, rewrites or delays a tool call, a prompt or a subagent.

| It sees | Through |
| --- | --- |
| every tool call's name and input, and whether it failed | `tool.call` |
| every permission verdict | `tool.check` |
| subagent spawns, their model requests and token usage, and their final answers | `agent.spawn`, `turn.step`, `turn.complete` |
| your prompts' first 70 characters, for the log | `turn.start` |
| context, cost and rate-limit readings | `session.measure`, `$.session.usage()` |
| the context breakdown `/context` shows (its categories, memory-file paths, MCP tools, agents and skills), estimated locally once per model; it keeps only the compaction window from it | `$.session.usage({ breakdown: 'summary' })` |
| advisor tool calls in the assistant's responses (their content is encrypted) | `session.append` |

What it keeps: short summaries (a tool name plus a path or command, with credentials masked) in session state, which ends with the session. It makes **no** network requests, runs no processes, reads and writes no files, stores nothing across sessions, and calls no model. `claude plugin validate .` prints exactly what it hooks and calls.

## What is inferred, not measured

- **Architect moments.** "Before a plan" means no edits yet this turn, "error repeats" means 2+ main-loop errors in a row, "before done" means edits were made. They are labelled `(inferred)`; turn them off with `moments: false`.
- **Compactions under the built-in guard.** Where Claude Code's guard keeps `session.compact` from Flightdeck (see [Troubleshooting](#troubleshooting)), the count is estimated. Claude Code reports no context fill until the first response after a new session, a `/clear` or a compaction. So a main-loop request that finds no fill after a response came back counts as a compaction. The main box shows `⟲~1`, with `(estimated)` when there's room, and the log says `context compacted (estimated)`. A rewind to your first prompt reads the same way, so it counts too. Wherever `session.compact` runs, its count replaces the estimate.
- **Server-side advice is encrypted.** For a server tool such as Claude Code's `advisor`, the pane counts and times the consult but cannot show what it said.
- **Per-agent context is the latest request's whole input** (uncached + cache read + cache write). It is labelled `ctx`, not cost: the API has no per-agent cost.
- **Other loops** can't tell a workflow agent from a compaction fork; both are model loops no card claims.
- **A background agent's first step** can arrive before its card exists, so its usage may show one step late.
- **Context against the compaction window.** When the session compacts in a smaller window than the model's, the gauge, `tokens/window` and the status line's `ctx N%` measure against that window, so they read higher than Claude Code's own status-line percentage (and claude-hud's), which measure against the model's window. Auto-compaction runs a little before 100%, at its threshold inside that window.
- **Time to first token.** `ttft` is timed at Flightdeck's own `turn.step` hook, so it includes everything beneath it: other plugins' hooks, the engine, the network and any retry. When the model's thinking isn't streamed, the first piece arrives after it, so `ttft` includes the thinking. Measured, not inferred, but not the API's own figure. There is no output rate: the reported tokens include thinking, so a rate over the visible stream isn't a real speed.

## Configure

In `/config`, or under `pluginConfigs[<id>].options` in your user `settings.json`, where `<id>` is how Claude Code loaded the plugin: `flightdeck@claude-flightdeck` when installed from the marketplace, `flightdeck` (or `flightdeck@inline`) with `--plugin-dir`. An entry under another key, or in project settings (`.claude/settings.json`), is ignored without a warning. From a terminal, `claude plugin configure flightdeck@claude-flightdeck` lists the options and which are unset, and saves them with `--values-stdin`.

| Option | Default | Meaning |
| --- | --- | --- |
| `architectPattern` | `advisor\|architect` | case-insensitive regex for agent types and server tools that count as the architect |
| `matchDescriptions` | `false` | also match agent descriptions, not just type names |
| `architectLabel` | `ARCHITECT` | the architect's name in the pane |
| `gateLabel` | `GATE` | the permission panel's name |
| `panels` | `main,architect,gate,agents,loops,receipt,log` | which panels show, in order |
| `layout` | `auto` | `mini`, `compact`, `wide`, or `auto` (mini inline, wide from 110 columns docked) |
| `maxCards` | `3` | cards side by side before swimlanes (1–6); fewer if the pane is too narrow |
| `paneColumns` | `66` | columns the docked pane asks for, 40 or more. Claude Code caps the dock at 45% of the terminal, and a width you dragged it to, in this session or an earlier one, wins. The wide layout starts at 110, so it needs a terminal of about 245 columns, or `layout: wide` |
| `motion` | `while-active` | `off` keeps connectors still |
| `moments` | `true` | show the inferred consult moments |
| `palette` | `theme` | `pastel` uses fixed colours tuned for dark terminals |
| `openOnStart` | `true` | ask to open the pane when a session starts |
| `statusLine` | `true` | context, running agents, consults and denials in the status line |

## Troubleshooting

**The pane doesn't appear.**
- Check `claude --version` is 2.1.287 or later, then run `/reload-plugins` and `/flightdeck`.
- Below 144 columns, Claude Code won't seat a pane nobody asked for; `/flightdeck` opens it at any width.
- Look in the transcript for a dim line starting `flightdeck:`. It names the hook that failed or the reason the pane was refused. Please [open an issue](https://github.com/scasella/claude-flightdeck/issues) with it.
- If the pane shows only `draw failed (…)`, its drawing hook threw; include that line in the issue too.

**Nothing shows in the VS Code extension.** In one report its 2.1.296 build ran Flightdeck's hooks but showed no pane, and none for another mod either ([#5](https://github.com/scasella/claude-flightdeck/issues/5)). Run `claude` in VS Code's integrated terminal instead, then `/flightdeck`: an integrated terminal is usually narrower than the 144 columns the pane needs to open by itself.

**Under a Team or Enterprise login, the permission mode is missing or stale, and compactions are estimated.** On a machine with managed settings, or in a session on a Team or Enterprise `/login`, Claude Code loads a built-in guard, `cc-plugin-sec-default`, that never runs a user-installed plugin's hooks on `classic.*` events or `session.compact` (see "Know which hooks of a user's mod don't run" in [Manage mods for your organization](https://code.claude.com/docs/en/plugins/mods/admin)). No other event a user's plugin can hook carries the permission mode except a subagent's start. So the main box shows no mode until a subagent starts, and then the mode as it was at that start. Until then, in auto mode the gate credits the calls the classifier cleared to `you`. Compactions are counted from the context Claude Code reports at each request instead, so the main box marks them `⟲~` and the log says `context compacted (estimated)` (see [What is inferred, not measured](#what-is-inferred-not-measured)). On 2.1.299 or later, `/plugin` shows a note naming those two hooks. The rest of the pane works. An administrator can let the hooks run by installing Flightdeck as one of the organization's own mods ([#23](https://github.com/scasella/claude-flightdeck/issues/23)).

**Options seem ignored.** Check the key in your user `settings.json`: `pluginConfigs["flightdeck@claude-flightdeck"]` when installed, `pluginConfigs["flightdeck"]` with `--plugin-dir`. See [Configure](#configure).

**Colours look wrong.** Set `palette` to `pastel` in `/config`.

**It's too much motion.** Set `motion` to `off`.

**Counters look stale after an update.** Run `/flightdeck reset`.

## How it works

| File | Holds |
| --- | --- |
| [`hooks/register.tsx`](hooks/register.tsx) | the event hooks, state access, and one function per panel |
| [`hooks/core.ts`](hooks/core.ts) | every reducer, formatter and layout rule as pure functions, so behaviour is testable directly |
| [`hooks/rail.tsx`](hooks/rail.tsx), [`hooks/elapsed.tsx`](hooks/elapsed.tsx) | surface modules: animated connectors and live clocks that redraw only themselves, on the surface's own frame clock |
| [`types/index.d.ts`](types/index.d.ts) | the state contract |
| [`tests/`](tests) | 54 tests: pure behaviour, plus drawings mounted on every surface at 24–120 columns, with every width from 24 to 40 checked for anything that spills past its box |

State lives in `$.state` atoms. Every read is merged over defaults, so a missing or older field never breaks the pane; an update that changes the state's shape may still reset its counters once. New to mods? Start with [Claude Code mods](https://claude.com/blog/claude-code-mods) and [Getting started with Claude Code mods](https://claude.dev/blog/getting-started-with-claude-code-mods/).

## Related projects

Flightdeck works alongside these, and owes ideas to them:

- [claude-hud](https://github.com/jarrodwatts/claude-hud): context, limits, tools and agents in your status line. Use both: that's the status line, this is the pane.
- [zoetrope](https://github.com/furkankly/zoetrope): a Claude Code or Codex session as a live flow graph.
- [ccusage](https://github.com/ccusage/ccusage): cost reports from your session logs.
- [awesome-claude-code-mods](https://github.com/karanb192/awesome-claude-code-mods): the index of Claude Code mods.

## Develop

```sh
claude --plugin-dir .            # load it; edits hot-reload
claude plugin validate .
claude plugin test .
npx -p typescript tsc -p .       # after the first load, which writes .claude-plugin/types/
```

See [CONTRIBUTING.md](CONTRIBUTING.md). Changes are listed in [CHANGELOG.md](CHANGELOG.md).

## License

[MIT](LICENSE)
