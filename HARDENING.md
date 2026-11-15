# Hardening (0.6.1-hardened.2)

Changes on top of upstream release 0.6.1 (bf43317), from a security audit.

| # | Finding | Fix | Test |
|---|---|---|---|
| 1 | `--token` / `--password` masked one word only; several token shapes not masked | `hooks/core.ts` SECRETS: flag values may be quoted; new patterns for AWS AKIA/ASIA ids, Google AIza keys, JWTs, Atlassian ATATT tokens, ghu_/ghr_ | `redaction masks quoted flag values and common token shapes` |
| 2 | turn.start logged the prompt line unredacted | `redact()` on the prompt line | `prompts, subagent descriptions and answers reach state redacted...` |
| 3 | Subagent description stored in full, unredacted | redacted, cut to 120 chars | same test |
| 4 | Subagent answer stored unredacted | redacted before the 400-char cut | same test |
| 5 | Bookkeeping faults in tool.check and turn.start could throw out of the hook | bookkeeping wrapped in try/catch; the verdict from `next(e)` and the turn go on unchanged | `a bookkeeping fault never blocks a turn or changes a verdict` (clock.now throws). Regression only: it passes without the try/catch too, because the engine already contains a throwing hook |
| 6 | tool.call passed the whole event to `describeInput` | uses `e.input` when present, else the event (tests pass input fields flat on the event) | covered by the existing tool.call tests |
| 7 | Status line showed `ctx NN%` that disagreed with the host status line | new option `contextWarning` (default false) hides the ctx part; the rest of the status line stays (0.6.1-hardened.2) | `the status line leaves out the ctx percent unless contextWarning is on` |
| 8 | `shorten()` kept terminal control bytes (ESC, C1 CSI) from tool and agent text | control bytes stripped before whitespace collapse and the cut | `shorten strips control bytes before collapsing` |
| 9 | URL-credential pattern backtracked quadratically: `redact('a.'.repeat(200000))` took 25.8 s | scheme quantifier bounded to `{0,31}`; description and answer sliced to 4x their cut before `redact()` | `redact stays fast on a long dotted input` (under 200 ms) |
| 10 | Architect advice reached state and the log unredacted | `redact()` in `consultEnded`, `noteAdvice` (stored and logged) and `adviceLine`; the repeat check compares the redacted text | `architect advice line masks credentials` |

Run: `claude plugin test .` and `claude plugin validate .`.
