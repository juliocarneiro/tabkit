import type { TabBeat, TabTheme, LayoutMetrics, InstrumentConfig } from '../types.js'
import { flattenBeat, durationToBeats, esc } from '../utils.js'

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const NOTE_TO_SEMITONE: Record<string, number> = {
  C: 0, 'C#': 1, Db: 1,
  D: 2, 'D#': 3, Eb: 3,
  E: 4,
  F: 5, 'F#': 6, Gb: 6,
  G: 7, 'G#': 8, Ab: 8,
  A: 9, 'A#': 10, Bb: 10,
  B: 11,
}

function fretToNoteName(tuningLabel: string, fret: number): string {
  const semitone = NOTE_TO_SEMITONE[tuningLabel]
  if (semitone === undefined) return ''
  return NOTE_NAMES[(semitone + fret) % 12]
}

/**
 * Render fret numbers for one measure's beats on the string lines.
 * When `showNoteLabels` is true, renders note names (C, D#, …) below each fret number.
 * Returns SVG group string + the total width consumed.
 */
export function renderNotes(
  beats: TabBeat[],
  instrument: InstrumentConfig,
  theme: TabTheme,
  layout: LayoutMetrics,
  startX: number,
  offsetY: number,
  leftHanded: boolean,
  measureIndex: number,
  showNoteLabels = false,
): { svg: string; width: number } {
  const parts: string[] = []
  let x = startX

  for (let beatIdx = 0; beatIdx < beats.length; beatIdx++) {
    const notes = flattenBeat(beats[beatIdx])
    const beatDurations = notes.map((n) => durationToBeats(n.duration))
    const beatDur = beatDurations.length > 0 ? Math.max(...beatDurations) : 1
    const beatW = beatDur * layout.beatWidth

    for (const note of notes) {
      const stringIdx = leftHanded
        ? instrument.strings - note.string
        : note.string - 1
      const y = offsetY + layout.marginTop + stringIdx * layout.stringSpacing
      const cx = x + beatW / 2
      const isHarmonic = note.technique === 'harmonic'
      const label = note.text ?? (isHarmonic ? `⟨${note.fret}⟩` : String(note.fret))
      const fontSize = label.length > 2 ? 10 : 12

      parts.push(
        `<rect x="${cx - 8}" y="${y - 8}" width="16" height="16" rx="3" fill="${theme.background}" />`,
      )
      parts.push(
        `<text x="${cx}" y="${y}" text-anchor="middle" dominant-baseline="central" ` +
          `fill="${note.accent ? theme.accentColor : theme.fretNumberColor}" ` +
          `font-family="${theme.fontFamily}" font-size="${fontSize}" font-weight="700" ` +
          `data-measure="${measureIndex}" data-beat="${beatIdx}" data-string="${note.string}" data-fret="${note.fret}">` +
          `${esc(label)}</text>`,
      )

      if (showNoteLabels) {
        const tuningIdx = leftHanded
          ? instrument.strings - note.string
          : note.string - 1
        const tuningLabel = instrument.tuning[tuningIdx] ?? ''
        const noteName = fretToNoteName(tuningLabel, note.fret)
        if (noteName) {
          parts.push(
            `<text x="${cx}" y="${y + 12}" text-anchor="middle" dominant-baseline="central" ` +
              `fill="${theme.techniqueColor}" font-family="${theme.fontFamily}" font-size="8" ` +
              `opacity="0.75">${esc(noteName)}</text>`,
          )
        }
      }
    }

    x += beatW
  }

  return { svg: `<g class="tk-notes">${parts.join('')}</g>`, width: x - startX }
}
