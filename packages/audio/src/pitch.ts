import type { InstrumentConfig } from '@tabkit/core'

/**
 * Standard open-string MIDI note numbers for built-in instruments.
 * Strings are listed from thickest (lowest) to thinnest (highest),
 * matching the tuning array order in InstrumentConfig.
 */
export const TUNING_MIDI: Record<string, number[]> = {
  guitar:  [40, 45, 50, 55, 59, 64],
  bass:    [28, 33, 38, 43],
  ukulele: [67, 60, 64, 69],
  banjo:   [67, 50, 55, 59, 62],
}

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1,
  D: 2, 'D#': 3, Eb: 3,
  E: 4,
  F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8,
  A: 9, 'A#': 10, Bb: 10,
  B: 11,
}

/**
 * Resolve the MIDI number for an open string given just a tuning label like "E".
 * Falls back to guitar standard tuning octaves when ambiguous.
 */
function labelToMidi(label: string, stringIndex: number, totalStrings: number): number {
  const semitone = NOTE_TO_SEMITONE[label]
  if (semitone === undefined) return 40

  // Estimate octave: thicker strings (higher index) are lower pitched
  const octave = totalStrings <= 4
    ? (stringIndex === 0 ? 4 : 3)
    : (stringIndex < 2 ? 2 : stringIndex < 4 ? 3 : 4)

  return 12 * (octave + 1) + semitone
}

/**
 * Get the MIDI note number for a specific string and fret.
 *
 * @param instrument - Instrument config with tuning array
 * @param stringNum  - 1-based string number (1 = thinnest)
 * @param fret       - Fret number (0 = open)
 */
export function fretToMidi(
  instrument: InstrumentConfig,
  stringNum: number,
  fret: number,
): number {
  const presetName = instrument.name ?? ''
  const presetMidi = TUNING_MIDI[presetName]

  // TUNING_MIDI is ordered thick→thin, so index for stringNum is strings-stringNum
  const midiIndex = instrument.strings - stringNum

  let openMidi: number
  if (presetMidi && midiIndex >= 0 && midiIndex < presetMidi.length) {
    openMidi = presetMidi[midiIndex]
  } else {
    // instrument.tuning is ordered thin→thick: index 0 = string 1 (thinnest)
    const tuningIdx = stringNum - 1
    const label = instrument.tuning[tuningIdx] ?? 'E'
    openMidi = labelToMidi(label, midiIndex, instrument.strings)
  }

  return openMidi + fret
}

/**
 * Convert a MIDI note number to frequency in Hz.
 * A4 (MIDI 69) = 440 Hz.
 */
export function midiToFrequency(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12)
}

/**
 * Convenience: string + fret directly to Hz.
 */
export function fretToFrequency(
  instrument: InstrumentConfig,
  stringNum: number,
  fret: number,
): number {
  return midiToFrequency(fretToMidi(instrument, stringNum, fret))
}
