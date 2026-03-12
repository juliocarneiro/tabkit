import type { TabMeasure, TabNote, TabBeat, InstrumentConfig } from './types.js'
import { flattenBeat } from './utils.js'

/**
 * Mirror a single note for left-handed mode.
 * Flips the string number (string 1 becomes string N, etc.)
 */
function mirrorNote(note: TabNote, totalStrings: number): TabNote {
  return { ...note, string: totalStrings - note.string + 1 }
}

/**
 * Mirror an entire beat (single note or chord).
 */
function mirrorBeat(beat: TabBeat, totalStrings: number): TabBeat {
  if (Array.isArray(beat)) {
    return beat.map((n) => mirrorNote(n, totalStrings))
  }
  return mirrorNote(beat, totalStrings)
}

/**
 * Mirror all measures for left-handed rendering.
 * This flips string numbers so string 1 (thinnest) appears at the bottom
 * instead of the top, matching a left-handed player's perspective.
 */
export function mirrorMeasures(
  measures: TabMeasure[],
  instrument: InstrumentConfig,
): TabMeasure[] {
  return measures.map((m) => ({
    ...m,
    beats: m.beats.map((b) => mirrorBeat(b, instrument.strings)),
  }))
}

/**
 * Check if left-handed mode should transform the data.
 * The actual string rendering and tuning label flipping happen in their
 * respective SVG renderers via the `leftHanded` flag. This function
 * handles the data-level mirroring.
 */
export function applyLeftHanded(
  measures: TabMeasure[],
  instrument: InstrumentConfig,
  leftHanded: boolean,
): TabMeasure[] {
  if (!leftHanded) return measures
  return mirrorMeasures(measures, instrument)
}
