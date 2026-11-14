import type { RenderElement, RenderNode } from 'claude-code'

// pane-grid reading module. Copy this file to <your mod>/hooks/pane-grid.ts unchanged.
// Source: https://github.com/hwanyong/pane-grid/blob/main/skills/add-pane-grid-cell/pane-grid.ts
// Guide: https://github.com/hwanyong/pane-grid/blob/main/docs/add-pane-grid-cell.md
//
// pane-grid's state types live in the pane-grid repository only, so this module checks the values it reads at run time.
// When pane-grid is not installed every read is undefined and your mod keeps drawing in its own pane or band.
//
// Load order does not matter. When your mod loads after pane-grid, next(e) holds nothing of pane-grid's and your
// `cell:<plugin>` Box goes after it, where pane-grid collects it. When your mod loads before pane-grid, next(e) holds
// pane-grid's drawing: fillSlot puts your cell into the `slot:<plugin>` Box pane-grid drew for it, and offerChoice adds
// your Button to each empty cell's `choices:<cell>` Box. pane-grid's ui.press hook answers that Button by its key.

const GRID_VERSION = 1
const SLOT_KEY = 'slot:'
const CHOICES_KEY = 'choices:'
const ACTIVE_SUFFIX = ':active'
const NONE_KEY = 'none:'
const PLACE_KEY = 'place:'
// Empty-cell choices take hotkeys 1-9 in the active cell only.
const CHOICE_HOTKEYS = 9

// The letters of pane-grid's toolbar hotkeys. A Button `hotkey` drawn in a cell acts for the whole grid pane, and of two
// Buttons with one hotkey the engine presses the later drawn. Leave these letters out of the hotkeys your cell draws.
export const TOOLBAR_KEYS = ['v', 's', 'o', 'z', 'x', 'w', 'b', 'c', 'k', 'q'] as const

// tab: the layout holding the cell. requestId: that layout's grid pane id (`grid-<tab>`).
// columns and rows: the size to draw in. Both are 0 until pane-grid has measured the pane.
// column and row: the top left of that area in the grid pane's body, as `UiScrollPointer` counts. isActive: the cell
// is the active or the zoomed one. pane-grid writes these three from 0.4.0; they are undefined before.
type GridPlacement = { tab: string; requestId: string; cell: string; columns: number; rows: number; column?: number; row?: number; isActive?: boolean }

const isPlacement = (value: unknown): value is GridPlacement => {
  if (typeof value != 'object' || value == null) return false
  const placement = value as Record<string, unknown>
  return typeof placement.tab == 'string' && typeof placement.requestId == 'string'
    && typeof placement.columns == 'number' && typeof placement.rows == 'number'
}

// Finds this mod's cell in a pane-grid layout value. Also used on a `state.set` hook's `value` and `previous`.
export const placementIn = (layout: unknown, plugin: string): GridPlacement | undefined => {
  if (typeof layout != 'object' || layout == null) return undefined
  const { version, placed } = layout as { version?: unknown; placed?: unknown }
  if (version != GRID_VERSION || typeof placed != 'object' || placed == null) return undefined
  const placement = (placed as Record<string, unknown>)[plugin]
  return isPlacement(placement) ? placement : undefined
}

// What offerChoice hands your Button maker: draw `<Button key={choice.key} plain label={choice.label} hotkey={choice.hotkey} onPress={() => {}} />`.
// The press is pane-grid's to answer (its ui.press hook reads the key), so onPress does nothing.
type GridChoice = { key: string; label: string; hotkey?: string }

const keyOf = (node: RenderNode) => {
  if (typeof node == 'string') return undefined
  const props: Record<string, unknown> | undefined = 'props' in node ? node.props : undefined
  const key = props?.key
  return typeof key == 'string' ? key : undefined
}

const childrenOf = (node: RenderElement): readonly RenderNode[] => ('children' in node && Array.isArray(node.children) ? node.children : [])

// Copies the tree only along the path to each node `change` replaces; the drawing next(e) handed you is frozen.
const rewrite = (element: RenderElement, change: (element: RenderElement) => RenderElement | undefined): RenderElement => {
  const changed = change(element)
  if (changed) return changed
  const children = childrenOf(element)
  const rewritten = children.map(child => (typeof child == 'string' ? child : rewrite(child, change)))
  return rewritten.every((child, index) => child === children[index]) ? element : ({ ...element, children: rewritten } as RenderElement)
}

// Puts `cell` into the slot pane-grid drew for this mod. undefined when next(e) holds no such slot (your mod loads
// after pane-grid, so pane-grid has not drawn yet): append the cell after next(e) instead, keyed `cell:<plugin>`.
export const fillSlot = (below: RenderElement, plugin: string, cell: RenderElement): RenderElement | undefined => {
  let isFilled = false
  const filled = rewrite(below, element => {
    if (keyOf(element) != `${SLOT_KEY}${plugin}`) return undefined
    isFilled = true
    return { ...element, children: [cell] } as RenderElement
  })
  return isFilled ? filled : undefined
}

// Adds this mod's Button to every empty cell's choices pane-grid drew. Unchanged when next(e) holds none.
// `placement` is this mod's current cell, if any: the label then says the press moves it from there.
export const offerChoice = (below: RenderElement, plugin: string, placement: GridPlacement | undefined, makeButton: (choice: GridChoice) => RenderElement): RenderElement =>
  rewrite(below, element => {
    const key = keyOf(element)
    if (!key?.startsWith(CHOICES_KEY)) return undefined
    const isActive = key.endsWith(ACTIVE_SUFFIX)
    const cell = key.slice(CHOICES_KEY.length, isActive ? -ACTIVE_SUFFIX.length : undefined)
    const choiceKey = `${PLACE_KEY}${cell}:${plugin}`
    const children = childrenOf(element).filter(child => !keyOf(child)?.startsWith(NONE_KEY))
    if (children.some(child => keyOf(child) == choiceKey)) return undefined
    const count = children.filter(child => keyOf(child)?.startsWith(PLACE_KEY)).length
    const hotkey = isActive && count < CHOICE_HOTKEYS ? String(count + 1) : undefined
    const label = placement ? `${plugin} (move from ${placement.cell})` : plugin
    return { ...element, children: [...children, makeButton({ key: choiceKey, label, hotkey })] } as RenderElement
  })
