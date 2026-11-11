import type { InstrumentConfig, TabTheme, LayoutMetrics } from '../types.js'
import { esc } from '../utils.js'

/**
 * Render the horizontal string lines for a single tab line, from `x1` to `x2`.
 * Returns an SVG group string.
 */
export function renderStrings(
  instrument: InstrumentConfig,
  theme: TabTheme,
  layout: LayoutMetrics,
  x1: number,
  x2: number,
  offsetY: number,
): string {
  const lines: string[] = []
  for (let i = 0; i < instrument.strings; i++) {
    const y = offsetY + layout.marginTop + i * layout.stringSpacing
    lines.push(
      `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" ` +
        `stroke="${theme.stringColor}" stroke-width="1" stroke-linecap="round"/>`,
    )
  }
  return `<g class="tk-strings">${lines.join('')}</g>`
}

/** Render tuning labels in the gutter at the left of a tab line */
export function renderTuning(
  instrument: InstrumentConfig,
  theme: TabTheme,
  layout: LayoutMetrics,
  offsetY: number,
  leftHanded: boolean,
): string {
  const labels: string[] = []
  const tuning = leftHanded ? [...instrument.tuning].reverse() : instrument.tuning
  // Right-aligned inside the tuning gutter, just before the strings start
  const x = layout.marginLeft + layout.tuningWidth - 7
  for (let i = 0; i < instrument.strings; i++) {
    const y = offsetY + layout.marginTop + i * layout.stringSpacing
    const label = tuning[i] ?? ''
    labels.push(
      `<text x="${x}" y="${y}" ` +
        `text-anchor="end" dominant-baseline="central" ` +
        `fill="${theme.textColor}" font-family="${theme.fontFamily}" font-size="11" font-weight="600">` +
        `${esc(label)}</text>`,
    )
  }
  return `<g class="tk-tuning">${labels.join('')}</g>`
}
