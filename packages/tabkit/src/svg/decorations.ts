import type { TabNote, TabTheme, LayoutMetrics, InstrumentConfig } from '../types.js'

interface DecorationContext {
  note: TabNote
  nextNote?: TabNote
  cx: number
  nextCx?: number
  instrument: InstrumentConfig
  theme: TabTheme
  layout: LayoutMetrics
  offsetY: number
  leftHanded: boolean
}

function getStringY(ctx: DecorationContext): number {
  const idx = ctx.leftHanded
    ? ctx.instrument.strings - ctx.note.string
    : ctx.note.string - 1
  return ctx.offsetY + ctx.layout.marginTop + idx * ctx.layout.stringSpacing
}

function hammerPull(ctx: DecorationContext, label: string): string {
  if (!ctx.nextCx) return ''
  const y = getStringY(ctx)
  const midX = (ctx.cx + ctx.nextCx) / 2
  const arcY = y - 14

  return (
    `<path d="M ${ctx.cx + 8} ${y - 9} Q ${midX} ${arcY} ${ctx.nextCx - 8} ${y - 9}" ` +
    `fill="none" stroke="${ctx.theme.techniqueColor}" stroke-width="1.2"/>` +
    `<text x="${midX}" y="${arcY - 2}" text-anchor="middle" ` +
    `fill="${ctx.theme.techniqueColor}" font-family="${ctx.theme.fontFamily}" font-size="8">${label}</text>`
  )
}

function slide(ctx: DecorationContext): string {
  if (!ctx.nextCx) return ''
  const y = getStringY(ctx)
  const goingUp = ctx.nextNote && ctx.nextNote.fret > ctx.note.fret
  const y1 = goingUp ? y + 6 : y - 6
  const y2 = goingUp ? y - 6 : y + 6

  return (
    `<line x1="${ctx.cx + 10}" y1="${y1}" x2="${ctx.nextCx - 10}" y2="${y2}" ` +
    `stroke="${ctx.theme.techniqueColor}" stroke-width="1.2" stroke-linecap="round"/>`
  )
}

function bend(ctx: DecorationContext): string {
  const y = getStringY(ctx)
  const tipY = y - 20

  return (
    `<path d="M ${ctx.cx} ${y - 9} L ${ctx.cx} ${tipY} L ${ctx.cx + 4} ${tipY + 4}" ` +
    `fill="none" stroke="${ctx.theme.techniqueColor}" stroke-width="1.2" stroke-linecap="round"/>` +
    `<polygon points="${ctx.cx + 4},${tipY + 4} ${ctx.cx + 1},${tipY + 1} ${ctx.cx + 5},${tipY + 1}" ` +
    `fill="${ctx.theme.techniqueColor}"/>`
  )
}

function vibrato(ctx: DecorationContext): string {
  const y = getStringY(ctx) - 12
  const segments = 4
  const segW = 5
  let d = `M ${ctx.cx - (segments * segW) / 2} ${y}`
  for (let i = 0; i < segments; i++) {
    const sx = ctx.cx - (segments * segW) / 2 + i * segW
    d += ` Q ${sx + segW / 4} ${y - 3} ${sx + segW / 2} ${y}`
    d += ` Q ${sx + (segW * 3) / 4} ${y + 3} ${sx + segW} ${y}`
  }
  return `<path d="${d}" fill="none" stroke="${ctx.theme.techniqueColor}" stroke-width="1"/>`
}

function mute(ctx: DecorationContext): string {
  const y = getStringY(ctx)
  const s = 5
  return (
    `<line x1="${ctx.cx - s}" y1="${y - s - 10}" x2="${ctx.cx + s}" y2="${y + s - 10}" ` +
    `stroke="${ctx.theme.techniqueColor}" stroke-width="1.2"/>` +
    `<line x1="${ctx.cx + s}" y1="${y - s - 10}" x2="${ctx.cx - s}" y2="${y + s - 10}" ` +
    `stroke="${ctx.theme.techniqueColor}" stroke-width="1.2"/>`
  )
}

/**
 * Render technique decorations (hammer-on, pull-off, slide, bend, vibrato, mute)
 * for a single note.
 */
export function renderDecoration(ctx: DecorationContext): string {
  if (!ctx.note.technique) return ''

  switch (ctx.note.technique) {
    case 'hammer':
      return hammerPull(ctx, 'H')
    case 'pull':
      return hammerPull(ctx, 'P')
    case 'slide':
      return slide(ctx)
    case 'bend':
      return bend(ctx)
    case 'vibrato':
      return vibrato(ctx)
    case 'mute':
      return mute(ctx)
    case 'tap':
      return hammerPull(ctx, 'T')
    case 'harmonic':
      return '' // harmonics are shown via the note label "⟨12⟩"
    default:
      return ''
  }
}
