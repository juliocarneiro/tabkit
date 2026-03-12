import type { TabTheme, LayoutMetrics, InstrumentConfig } from '../types.js'

/**
 * Render a time signature (e.g. 4/4) at the start of a line.
 */
export function renderTimeSignature(
  ts: [number, number],
  x: number,
  instrument: InstrumentConfig,
  theme: TabTheme,
  layout: LayoutMetrics,
  offsetY: number,
): string {
  const topY = offsetY + layout.marginTop
  const totalHeight = (instrument.strings - 1) * layout.stringSpacing
  const midY = topY + totalHeight / 2

  const top = `<text x="${x}" y="${midY - 4}" text-anchor="middle" dominant-baseline="auto" ` +
    `fill="${theme.textColor}" font-family="${theme.fontFamily}" font-size="14" font-weight="700">` +
    `${ts[0]}</text>`

  const bottom = `<text x="${x}" y="${midY + 4}" text-anchor="middle" dominant-baseline="hanging" ` +
    `fill="${theme.textColor}" font-family="${theme.fontFamily}" font-size="14" font-weight="700">` +
    `${ts[1]}</text>`

  return `<g class="tk-time-sig">${top}${bottom}</g>`
}
