// A connector drawn on the surface's own frame clock: packets travel along it while `active`,
// and it rests as a plain dim line otherwise. Only this region redraws; the pane does not.
import type { ClientModule, RenderChildren } from 'claude-code'

type Props = {
  active: boolean
  width: number
  color: string
  dim: string
  /** Cells where a branch drops (┬); the rest of the line is ─. */
  marks: number[]
  /** Draw ┴ instead of ┬ at the marks: a merge into what is below. */
  isMerge: boolean
  /** Ask for the surface's monospaced face: only where the engine has it (2.1.299+); the prop is left off otherwise. */
  mono: boolean
}

type Ref = { phase: number; active: boolean }
type State = { ref: Ref }

const STEP_MS = 110
/** Dashes drawn past the line's end and clipped by its box, so the right end is the box's edge. */
const SPARE = 4

const Rail: ClientModule<Props, State> = (props, surface) => {
  const { Box, Text } = surface.elements
  const ref = surface.state?.ref ?? { phase: 0, active: props.active }
  ref.active = props.active
  if (surface.state === undefined) {
    surface.setState({ ref })
    surface.every(STEP_MS, () => {
      if (ref.active) {
        ref.phase += 1
        surface.setState({ ref })
      }
    })
  }

  const width = Math.max(1, surface.columns || props.width)
  const cells = Array.from({ length: width + SPARE }, () => '─')
  for (const m of props.marks) if (m >= 0 && m < width) cells[m] = props.isMerge ? '┴' : '┬'

  // A graphical surface draws text in a proportional face, where ─ ● • and bold differ in width, so as
  // the packets moved the line's length changed and its right end jittered. Drawn in the surface's
  // monospaced face (whose advance is what a cell is there) each glyph is one cell, and the line sits in
  // a box of its width that clips the spare dashes: its right end is that edge, every frame. An engine
  // before 2.1.299 has no such face, and the prop is left off there rather than passed as false.
  const line = (children: RenderChildren) => (
    <Box width={width} overflow="hidden">
      <Box flexShrink={0}>{children}</Box>
    </Box>
  )
  const face = props.mono ? { mono: true } : {}

  if (!props.active) {
    return line(
      <Text color={props.dim} {...face}>
        {cells.join('')}
      </Text>,
    )
  }

  // Two packets per 24 cells, a bright head and a trailing dot, moving left to right.
  const lit = new Map<number, string>()
  for (let base = 0; base < width + 24; base += 24) {
    const head = (base + ref.phase) % (width + 24)
    if (head < width) lit.set(head, '●')
    if (head - 1 >= 0 && head - 1 < width) lit.set(head - 1, '•')
  }
  // Runs, not cells: consecutive cells of one kind share a Text, a handful of nodes per frame.
  const runs: { text: string; isLit: boolean }[] = []
  cells.forEach((ch, i) => {
    const isLit = lit.has(i)
    const last = runs[runs.length - 1]
    const glyph = lit.get(i) ?? ch
    if (last && last.isLit === isLit) last.text += glyph
    else runs.push({ text: glyph, isLit })
  })
  return line(
    runs.map(r => (
      <Text color={r.isLit ? props.color : props.dim} bold={r.isLit} {...face}>
        {r.text}
      </Text>
    )),
  )
}

export default Rail
