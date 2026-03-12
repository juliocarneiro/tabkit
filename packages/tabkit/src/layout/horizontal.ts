import type { TabMeasure, LayoutMetrics } from '../types.js'
import { flattenBeat, durationToBeats } from '../utils.js'

/**
 * Calculate the pixel width a measure will occupy.
 */
export function measureWidth(
  measure: TabMeasure,
  layout: LayoutMetrics,
): number {
  let w = layout.barlinePadding * 2 // padding before+after barline
  for (const beat of measure.beats) {
    const notes = flattenBeat(beat)
    const durations = notes.map((n) => durationToBeats(n.duration))
    const dur = durations.length > 0 ? Math.max(...durations) : 1
    w += dur * layout.beatWidth
  }
  return Math.max(w, layout.beatWidth) // minimum 1 beat wide
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
): MeasureLayout[] {
  const result: MeasureLayout[] = []
  let x = startX

  for (let i = 0; i < measures.length; i++) {
    const w = measureWidth(measures[i], layout)
    result.push({ measureIndex: i, x, width: w })
    x += w
  }

  return result
}
