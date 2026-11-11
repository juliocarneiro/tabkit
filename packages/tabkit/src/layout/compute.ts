import type { TabOptions, LayoutMetrics } from '../types.js'
import { resolveInstrument, DEFAULT_LAYOUT } from '../types.js'
import { reflowMeasures } from './reflow.js'
import { measureWidth, timeSignatureFlags, TIME_SIGNATURE_WIDTH } from './horizontal.js'

export interface MeasureBox {
  /** Index of the measure in `options.measures` */
  index: number
  /** x of the measure's left barline */
  x: number
  /** Width from left barline to right barline */
  width: number
  /** x where the first beat starts */
  contentX: number
  /** Whether a time signature is drawn at the start of this measure */
  timeSignature: boolean
}

export interface LineBox {
  index: number
  /** Vertical offset of the line block */
  offsetY: number
  /** y of the first (top) string */
  top: number
  /** y of the last (bottom) string */
  bottom: number
  startMeasureIndex: number
  measures: MeasureBox[]
}

export interface TabLayout {
  /** Final SVG width (grows past `options.width` when content can't fit) */
  width: number
  height: number
  /** x where string lines start (after the tuning labels) */
  contentStartX: number
  stringSpacing: number
  lines: LineBox[]
}

/**
 * Compute where every line and measure lands in the rendered SVG.
 * This is the single source of truth used by `TabRenderer.svg`, so it can be
 * used for hit-testing (editors) or custom overlays.
 */
export function computeTabLayout(
  options: TabOptions,
  metrics: LayoutMetrics = DEFAULT_LAYOUT,
): TabLayout {
  const instrument = resolveInstrument(options.instrument)
  const requestedWidth = Number(options.width ?? 800) || 800
  const showTuning = options.showTuning ?? true
  const showTimeSig = options.showTimeSignature ?? true
  const responsive = (options.layout ?? 'responsive') === 'responsive'
  const measures = options.measures ?? []

  const contentStartX = metrics.marginLeft + (showTuning ? metrics.tuningWidth : 0)
  const stringHeight = Math.max(0, instrument.strings - 1) * metrics.stringSpacing
  const lineHeight = metrics.marginTop + stringHeight + metrics.marginBottom
  const flags = showTimeSig ? timeSignatureFlags(measures) : []

  const groups = responsive
    ? reflowMeasures(measures, instrument, metrics, requestedWidth, showTuning, showTimeSig).lines
    : measures.length > 0
      ? [{ measures, startMeasureIndex: 0 }]
      : []

  let widest = 0
  const lines: LineBox[] = groups.map((group, li) => {
    const offsetY = li * (lineHeight + metrics.lineGap)
    let x = contentStartX
    const boxes: MeasureBox[] = group.measures.map((m, mi) => {
      const index = group.startMeasureIndex + mi
      const ts = flags[index] ?? false
      const width = measureWidth(m, metrics, ts)
      const box: MeasureBox = {
        index,
        x,
        width,
        contentX: x + metrics.barlinePadding + (ts ? TIME_SIGNATURE_WIDTH : 0),
        timeSignature: ts,
      }
      x += width
      return box
    })
    widest = Math.max(widest, x + metrics.marginRight)
    return {
      index: li,
      offsetY,
      top: offsetY + metrics.marginTop,
      bottom: offsetY + metrics.marginTop + stringHeight,
      startMeasureIndex: group.startMeasureIndex,
      measures: boxes,
    }
  })

  // The SVG never clips its content: a fixed layout sizes to the single row,
  // a responsive one only grows when one measure is wider than requested.
  const width =
    responsive || options.width !== undefined || measures.length === 0
      ? Math.max(requestedWidth, widest)
      : widest

  const height =
    lines.length * lineHeight + Math.max(0, lines.length - 1) * metrics.lineGap

  return {
    width,
    height,
    contentStartX,
    stringSpacing: metrics.stringSpacing,
    lines,
  }
}
