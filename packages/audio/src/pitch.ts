import type { InstrumentConfig } from '@tabkit/core'

/**
 * Standard open-string MIDI note numbers for built-in instruments.
 * Strings are listed from thickest (lowest) to thinnest (highest),
 * i.e. the reverse of the tuning array order in InstrumentConfig.
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

interface ParsedLabel {
  semitone: number
  /** Scientific octave when the label carries one ("E2"), otherwise undefined */
  octave?: number
}

function parseLabel(label: string | undefined): ParsedLabel | undefined {
  if (!label) return undefined
  const m = label.trim().match(/^([A-Ga-g])([#b]?)(-?\d+)?$/)
  if (!m) return undefined
  const semitone = NOTE_TO_SEMITONE[m[1].toUpperCase() + m[2]]
  if (semitone === undefined) return undefined
  return { semitone, octave: m[3] !== undefined ? parseInt(m[3], 10) : undefined }
}

/** The pitch with pitch class `semitone` closest to `reference` */
function nearestTo(reference: number, semitone: number): number {
  let diff = (((semitone - reference) % 12) + 12) % 12 // 0..11 semitones above
  if (diff > 6) diff -= 12
  return reference + diff
}

/** Lowest pitch assumed for the thickest string when nothing else is known */
function lowestFloor(strings: number): number {
  if (strings >= 8) return 28 // E1
  if (strings === 7) return 33 // A1
  if (strings === 6) return 36 // C2
  return 48 // C3
}

/**
 * Resolve the open-string MIDI numbers of an instrument, indexed like
 * `instrument.tuning` (index 0 = string 1 = thinnest).
 *
 * Resolution order per string:
 * 1. A label with an octave ("E2", "Bb3") is taken literally.
 * 2. For a built-in instrument name, the pitch class from the tuning label
 *    nearest to the standard tuning (so "drop D" on a guitar just works).
 * 3. Otherwise octaves are estimated by walking up from the thickest string.
 */
export function openStringMidi(instrument: InstrumentConfig): number[] {
  const count = instrument.strings
  const preset = TUNING_MIDI[instrument.name ?? '']
  const usePreset = !!preset && preset.length === count
  const result: number[] = new Array(count)

  let previous: number | undefined
  // Walk from the thickest string (last tuning entry) to the thinnest
  for (let idx = count - 1; idx >= 0; idx--) {
    const parsed = parseLabel(instrument.tuning[idx])
    const reference = usePreset ? preset[count - 1 - idx] : undefined
    let midi: number

    if (parsed && parsed.octave !== undefined) {
      midi = 12 * (parsed.octave + 1) + parsed.semitone
    } else if (reference !== undefined) {
      midi = parsed ? nearestTo(reference, parsed.semitone) : reference
    } else if (parsed) {
      const floor = previous ?? lowestFloor(count)
      midi = floor + ((((parsed.semitone - floor) % 12) + 12) % 12)
    } else {
      midi = previous ?? 40
    }

    result[idx] = midi
    previous = midi
  }

  return result
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
  const open = openStringMidi(instrument)
  const idx = Math.max(0, Math.min(open.length - 1, stringNum - 1))
  return (open[idx] ?? 40) + fret
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
