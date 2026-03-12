import type { TabTheme, LayoutMetrics, InstrumentConfig } from '../types.js'

/**
 * Render the playback cursor line.
 * The cursor is an animated vertical line that moves across the tab.
 */
export function renderCursor(
  instrument: InstrumentConfig,
  theme: TabTheme,
  layout: LayoutMetrics,
  offsetY: number,
): string {
  const topY = offsetY + layout.marginTop - 4
  const bottomY = topY + (instrument.strings - 1) * layout.stringSpacing + 8

  return (
    `<line class="tk-cursor" x1="0" y1="${topY}" x2="0" y2="${bottomY}" ` +
    `stroke="${theme.cursorColor}" stroke-width="2" stroke-linecap="round" ` +
    `style="opacity:0"/>`
  )
}
