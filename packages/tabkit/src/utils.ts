import type { TabBeat, TabNote, TabMeasure, LayoutMetrics } from './types.js'

/** XML-escape a string for safe SVG embedding (text content and attribute values) */
export function esc(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Convert a Duration token to a fractional beat count (quarter = 1) */
export function durationToBeats(d: string): number {
  switch (d) {
    case '1n':
      return 4
    case '2n':
      return 2
    case '4n':
      return 1
    case '8n':
      return 0.5
    case '16n':
      return 0.25
    case '32n':
      return 0.125
    case '8t':
      return 1 / 3
    case '4t':
      return 2 / 3
    default:
      return 1
  }
}

/** Flatten a TabBeat into an array of TabNote (handles single note or chord) */
export function flattenBeat(beat: TabBeat): TabNote[] {
  return Array.isArray(beat) ? beat : [beat]
}

/** Rhythmic length of a beat in quarter notes (longest note of a chord wins) */
export function beatDurationBeats(beat: TabBeat): number {
  const notes = flattenBeat(beat)
  if (notes.length === 0) return 1
  let max = 0
  for (const n of notes) max = Math.max(max, durationToBeats(n.duration))
  return max
}

/** Smallest horizontal slot a beat can take, so fret numbers never overlap */
export const DEFAULT_MIN_BEAT_WIDTH = 20

/** Pixel width of a beat: proportional to its duration, never below the minimum slot */
export function beatPixelWidth(beat: TabBeat, layout: LayoutMetrics): number {
  const min = layout.minBeatWidth ?? DEFAULT_MIN_BEAT_WIDTH
  return Math.max(beatDurationBeats(beat) * layout.beatWidth, min)
}

/** Get the total duration of a measure in quarter-note beats */
export function measureDurationBeats(measure: TabMeasure): number {
  return measure.beats.reduce((sum, beat) => sum + beatDurationBeats(beat), 0)
}
