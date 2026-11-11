import type { TabTheme, LayoutMetrics, InstrumentConfig } from '../types.js'

export interface BarlineOptions {
  /** A repeat section starts right after this barline */
  repeatStart?: boolean
  /** A repeat section ends at this barline */
  repeatEnd?: boolean
  /** Number of times the ending repeat is played (shown when > 2) */
  times?: number
  /** First barline of the whole piece (drawn thick) */
  isFirst?: boolean
  /** Final barline of the whole piece (drawn double) */
  isLast?: boolean
}

/** Render a single vertical barline */
function barline(
  x: number,
  topY: number,
  bottomY: number,
  theme: TabTheme,
  thick = false,
): string {
  return (
    `<line x1="${x}" y1="${topY}" x2="${x}" y2="${bottomY}" ` +
    `stroke="${theme.barlineColor}" stroke-width="${thick ? 3 : 1}" stroke-linecap="round"/>`
  )
}

/** Render repeat dots: two circles sitting in the spaces around the middle of the staff */
function repeatDots(
  x: number,
  topY: number,
  spacing: number,
  stringCount: number,
  theme: TabTheme,
): string {
  const center = topY + ((stringCount - 1) / 2) * spacing
  // Even string counts have a space in the middle, odd ones a string
  const offset = stringCount % 2 === 0 && stringCount >= 4 ? spacing : spacing / 2
  return (
    `<circle cx="${x}" cy="${center - offset}" r="2.5" fill="${theme.textColor}"/>` +
    `<circle cx="${x}" cy="${center + offset}" r="2.5" fill="${theme.textColor}"/>`
  )
}

/**
 * Render the barline at `x`, including repeat signs on either side.
 */
export function renderBarlines(
  x: number,
  instrument: InstrumentConfig,
  theme: TabTheme,
  layout: LayoutMetrics,
  offsetY: number,
  opts: BarlineOptions = {},
): string {
  const topY = offsetY + layout.marginTop
  const bottomY = topY + (instrument.strings - 1) * layout.stringSpacing
  const sp = layout.stringSpacing
  const strings = instrument.strings
  const parts: string[] = []

  if (opts.repeatEnd) {
    parts.push(repeatDots(x - 10, topY, sp, strings, theme))
    parts.push(barline(x - 4, topY, bottomY, theme))

    if (opts.times && opts.times > 2) {
      parts.push(
        `<text x="${x}" y="${topY - 6}" text-anchor="middle" ` +
          `fill="${theme.textColor}" font-family="${theme.fontFamily}" font-size="10">` +
          `x${Number(opts.times)}</text>`,
      )
    }
  }

  if (opts.repeatStart) {
    parts.push(barline(x + 4, topY, bottomY, theme))
    parts.push(repeatDots(x + 10, topY, sp, strings, theme))
  }

  if (opts.repeatStart || opts.repeatEnd) {
    parts.push(barline(x, topY, bottomY, theme, true))
  } else if (opts.isLast) {
    parts.push(barline(x - 4, topY, bottomY, theme))
    parts.push(barline(x, topY, bottomY, theme, true))
  } else {
    parts.push(barline(x, topY, bottomY, theme, !!opts.isFirst))
  }

  return `<g class="tk-barline">${parts.join('')}</g>`
}
