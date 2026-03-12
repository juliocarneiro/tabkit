import type { InstrumentConfig, TabTheme, LayoutMetrics } from '../types.js'

/**
 * Render the horizontal string lines for a single tab line.
 * Returns an SVG group string.
 */
export function renderStrings(
  instrument: InstrumentConfig,
  theme: TabTheme,
  layout: LayoutMetrics,
  lineWidth: number,
  offsetY: number,
): string {
  const lines: string[] = []
  for (let i = 0; i < instrument.strings; i++) {
    const y = offsetY + layout.marginTop + i * layout.stringSpacing
    lines.push(
      `<line x1="${layout.marginLeft}" y1="${y}" x2="${layout.marginLeft + lineWidth}" y2="${y}" ` +
        `stroke="${theme.stringColor}" stroke-width="1" stroke-linecap="round"/>`,
    )
  }
  return `<g class="tk-strings">${lines.join('')}</g>`
}

/** Render tuning labels at the left edge of a tab line */
export function renderTuning(
  instrument: InstrumentConfig,
  theme: TabTheme,
  layout: LayoutMetrics,
  offsetY: number,
  leftHanded: boolean,
): string {
  const labels: string[] = []
  const tuning = leftHanded ? [...instrument.tuning].reverse() : instrument.tuning
  for (let i = 0; i < instrument.strings; i++) {
    const y = offsetY + layout.marginTop + i * layout.stringSpacing
    const label = tuning[i] ?? ''
    labels.push(
      `<text x="${layout.marginLeft - 6}" y="${y}" ` +
        `text-anchor="end" dominant-baseline="central" ` +
        `fill="${theme.textColor}" font-family="${theme.fontFamily}" font-size="11" font-weight="600">` +
        `${label}</text>`,
    )
  }
  return `<g class="tk-tuning">${labels.join('')}</g>`
}
