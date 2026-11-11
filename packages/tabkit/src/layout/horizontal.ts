import type { TabMeasure, LayoutMetrics } from '../types.js'
import { beatPixelWidth } from '../utils.js'

/** Horizontal space reserved for a time signature inside a measure */
export const TIME_SIGNATURE_WIDTH = 24

/** Pixel width of the notes area of a measure (no barline padding) */
export function measureContentWidth(
  measure: TabMeasure,
  layout: LayoutMetrics,
): number {
  // An empty measure still gets one beat of room so it stays visible/clickable
  if (measure.beats.length === 0) return layout.beatWidth
  let w = 0
  for (const beat of measure.beats) w += beatPixelWidth(beat, layout)
  return w
}

/**
 * Calculate the pixel width a measure will occupy, barline to barline.
 * Pass `withTimeSignature` when the measure draws a time signature.
 */
export function measureWidth(
  measure: TabMeasure,
  layout: LayoutMetrics,
  withTimeSignature = false,
): number {
  return (
    layout.barlinePadding * 2 +
    measureContentWidth(measure, layout) +
    (withTimeSignature ? TIME_SIGNATURE_WIDTH : 0)
  )
}

/**
 * For each measure, whether it draws a time signature: the first measure
 * that declares one, and every measure where it changes afterwards.
 */
export function timeSignatureFlags(measures: TabMeasure[]): boolean[] {
  const flags: boolean[] = []
  let current: [number, number] | undefined
  for (const m of measures) {
    const ts = m.timeSignature
    const changed = !!ts && (!current || current[0] !== ts[0] || current[1] !== ts[1])
    flags.push(changed)
    if (ts) current = ts
  }
  return flags
}

export interface MeasureLayout {
  measureIndex: number
  x: number
  width: number
}

/**
 * Lay out all measures in a single row (no wrapping).
 * Returns position and width for each measure.
 */
export function layoutMeasures(
  measures: TabMeasure[],
  layout: LayoutMetrics,
  startX: number,
  showTimeSignature = false,
): MeasureLayout[] {
  const result: MeasureLayout[] = []
  const flags = showTimeSignature ? timeSignatureFlags(measures) : []
  let x = startX

  for (let i = 0; i < measures.length; i++) {
    const w = measureWidth(measures[i], layout, flags[i] ?? false)
    result.push({ measureIndex: i, x, width: w })
    x += w
  }

  return result
}
