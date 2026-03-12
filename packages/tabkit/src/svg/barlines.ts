import type { TabTheme, LayoutMetrics, InstrumentConfig, RepeatMark } from '../types.js'

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

/** Render repeat dots (two small circles) */
function repeatDots(
  x: number,
  topY: number,
  spacing: number,
  stringCount: number,
  theme: TabTheme,
): string {
  const midLow = Math.floor(stringCount / 2) - 1
  const midHigh = midLow + 1
  const y1 = topY + midLow * spacing + spacing / 2
  const y2 = topY + midHigh * spacing - spacing / 2
  return (
    `<circle cx="${x}" cy="${y1}" r="2.5" fill="${theme.textColor}"/>` +
    `<circle cx="${x}" cy="${y2}" r="2.5" fill="${theme.textColor}"/>`
  )
}

/**
 * Render barlines (start, end, repeats) for a measure.
 */
export function renderBarlines(
  x: number,
  instrument: InstrumentConfig,
  theme: TabTheme,
  layout: LayoutMetrics,
  offsetY: number,
  repeat?: RepeatMark,
  isFirst?: boolean,
  isLast?: boolean,
): string {
  const topY = offsetY + layout.marginTop
  const bottomY = topY + (instrument.strings - 1) * layout.stringSpacing
  const parts: string[] = []

  if (isFirst) {
    parts.push(barline(x, topY, bottomY, theme, true))
  }

  if (repeat?.start) {
    parts.push(barline(x + 4, topY, bottomY, theme))
    parts.push(repeatDots(x + 12, topY, layout.stringSpacing, instrument.strings, theme))
  }

  if (repeat?.end) {
    parts.push(repeatDots(x - 12, topY, layout.stringSpacing, instrument.strings, theme))
    parts.push(barline(x - 4, topY, bottomY, theme))
    parts.push(barline(x, topY, bottomY, theme, true))

    if (repeat.times && repeat.times > 2) {
      parts.push(
        `<text x="${x}" y="${topY - 6}" text-anchor="middle" ` +
          `fill="${theme.textColor}" font-family="${theme.fontFamily}" font-size="10">` +
          `x${repeat.times}</text>`,
      )
    }
  } else if (isLast) {
    parts.push(barline(x - 2, topY, bottomY, theme))
    parts.push(barline(x, topY, bottomY, theme, true))
  } else {
    parts.push(barline(x, topY, bottomY, theme))
  }

  return `<g class="tk-barline">${parts.join('')}</g>`
}
