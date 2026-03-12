import type { TabBeat, TabNote, TabMeasure } from './types.js'

/** XML-escape a string for safe SVG embedding */
export function esc(str: string): string {
  return str
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

/** Get the total duration of a measure in quarter-note beats */
export function measureDurationBeats(measure: TabMeasure): number {
  return measure.beats.reduce((sum, beat) => {
    const notes = flattenBeat(beat)
    const durations = notes.map((n) => durationToBeats(n.duration))
    const maxDur = durations.length > 0 ? Math.max(...durations) : 1
    return sum + maxDur
  }, 0)
}
