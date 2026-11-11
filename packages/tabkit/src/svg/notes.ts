import type { TabBeat, TabTheme, LayoutMetrics, InstrumentConfig } from '../types.js'
import { flattenBeat, beatPixelWidth, esc } from '../utils.js'

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
  // Accept labels with an octave ("E2") by ignoring the digits
  const semitone = NOTE_TO_SEMITONE[tuningLabel.replace(/-?\d+$/, '')]
  if (semitone === undefined) return ''
  return NOTE_NAMES[(((semitone + fret) % 12) + 12) % 12]
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
    const beatW = beatPixelWidth(beats[beatIdx], layout)

    for (const note of notes) {
      const stringIdx = leftHanded
        ? instrument.strings - note.string
        : note.string - 1
      const y = offsetY + layout.marginTop + stringIdx * layout.stringSpacing
      const cx = x + beatW / 2
      const isHarmonic = note.technique === 'harmonic'
      const label = note.text ?? (isHarmonic ? `⟨${note.fret}⟩` : String(note.fret))
      const fontSize = label.length > 2 ? 10 : 12
      const data =
        `data-measure="${measureIndex}" data-beat="${beatIdx}" ` +
        `data-string="${Number(note.string)}" data-fret="${Number(note.fret)}"`

      parts.push(
        `<rect x="${cx - 8}" y="${y - 8}" width="16" height="16" rx="3" fill="${theme.background}" ${data}/>`,
      )
      parts.push(
        `<text x="${cx}" y="${y}" text-anchor="middle" dominant-baseline="central" ` +
          `fill="${note.accent ? theme.accentColor : theme.fretNumberColor}" ` +
          `font-family="${theme.fontFamily}" font-size="${fontSize}" font-weight="700" ` +
          `${data}>${esc(label)}</text>`,
      )

      if (showNoteLabels) {
        // The pitch of a string does not depend on handedness — only its position does
        const tuningLabel = instrument.tuning[note.string - 1] ?? ''
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
