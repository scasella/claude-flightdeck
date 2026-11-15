# Hardening (0.6.1-hardened.1)

Changes on top of upstream release 0.6.1 (bf43317), from a security audit.

| # | Finding | Fix | Test |
|---|---|---|---|
| 1 | `--token` / `--password` masked one word only; several token shapes not masked | `hooks/core.ts` SECRETS: flag values may be quoted; new patterns for AWS AKIA/ASIA ids, Google AIza keys, JWTs, Atlassian ATATT tokens, ghu_/ghr_ | `redaction masks quoted flag values and common token shapes` |
| 2 | turn.start logged the prompt line unredacted | `redact()` on the prompt line | `prompts, subagent descriptions and answers reach state redacted...` |
| 3 | Subagent description stored in full, unredacted | redacted, cut to 120 chars | same test |
| 4 | Subagent answer stored unredacted | redacted before the 400-char cut | same test |
| 5 | Bookkeeping faults in tool.check and turn.start could throw out of the hook | bookkeeping wrapped in try/catch; the verdict from `next(e)` and the turn go on unchanged | `a bookkeeping fault never blocks a turn or changes a verdict` (clock.now throws). Regression only: it passes without the try/catch too, because the engine already contains a throwing hook |
| 6 | tool.call passed the whole event to `describeInput` | uses `e.input` when present, else the event (tests pass input fields flat on the event) | covered by the existing tool.call tests |

Run: `claude plugin test .` and `claude plugin validate .`.
