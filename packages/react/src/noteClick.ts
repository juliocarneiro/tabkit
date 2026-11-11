import { flattenBeat } from '@tabkit/core'
import type { TabMeasure, TabNote } from '@tabkit/core'

export interface NoteHit {
  note: TabNote
  measure: number
  beat: number
}

/**
 * Resolve a click inside a rendered tabkit SVG to the note under the pointer.
 * Works for the fret number and its background box.
 */
export function noteFromEvent(e: Event, measures: TabMeasure[]): NoteHit | null {
  const target = e.target as Element | null
  const el = target?.closest?.('[data-fret]')
  if (!el) return null

  const measure = el.getAttribute('data-measure')
  const beat = el.getAttribute('data-beat')
  const string = el.getAttribute('data-string')
  const fret = el.getAttribute('data-fret')
  if (measure === null || beat === null || string === null || fret === null) return null

  const mi = Number(measure)
  const bi = Number(beat)
  const si = Number(string)
  const fi = Number(fret)

  const beatData = measures[mi]?.beats[bi]
  const notes = beatData ? flattenBeat(beatData) : []
  const matched = notes.find((n) => n.string === si && n.fret === fi)

  return {
    note: matched ?? { string: si, fret: fi, duration: '4n' },
    measure: mi,
    beat: bi,
  }
}
