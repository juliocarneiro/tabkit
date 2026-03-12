import type { TabMeasure, TabNote, TabBeat, Duration } from 'tabkit'
import type { AsciiParseOptions } from './types.js'

interface RawStringLine {
  content: string
}

/**
 * Parse a block of ASCII tablature text into TabMeasure[].
 *
 * Supports the classic format:
 * ```
 * e|---0---1---3---|---0---1---3---|
 * B|---1---1---0---|---1---1---0---|
 * G|---0---2---0---|---0---2---0---|
 * D|---2---3---0---|---2---3---0---|
 * A|---3---3---2---|---3---3---2---|
 * E|---x---1---3---|---x---1---3---|
 * ```
 */
export function parseAsciiTab(
  input: string,
  options?: AsciiParseOptions,
): TabMeasure[] {
  const defaultDuration: Duration = options?.defaultDuration ?? '8n'
  const lines = input.split('\n').map((l) => l.trim()).filter(Boolean)

  // Extract string lines (lines that match "X|..." pattern)
  const stringLines: RawStringLine[] = []
  for (const line of lines) {
    const match = line.match(/^([A-Ga-g#b]?)\s*\|(.+)/)
    if (match) {
      stringLines.push({ content: match[2] })
    }
  }

  if (stringLines.length === 0) return []

  // Split each string line by barlines (|) into measure segments
  const measureSegments: string[][] = []
  for (const sl of stringLines) {
    const segments = sl.content.split('|').filter((s) => s.length > 0)
    // Trim trailing pipe content
    const cleaned = segments.map((s) => s.replace(/\|$/, ''))
    if (measureSegments.length === 0) {
      for (const _ of cleaned) measureSegments.push([])
    }
    for (let mi = 0; mi < cleaned.length && mi < measureSegments.length; mi++) {
      measureSegments[mi].push(cleaned[mi])
    }
    // Handle case where this line has more measures
    for (let mi = measureSegments.length; mi < cleaned.length; mi++) {
      measureSegments.push([cleaned[mi]])
    }
  }

  // Parse each measure segment
  const measures: TabMeasure[] = []

  for (const segment of measureSegments) {
    const beats: TabBeat[] = []

    // Find note positions across all strings
    // A "column" in the ASCII tab is a vertical slice
    if (segment.length === 0) continue

    const maxLen = Math.max(...segment.map((s) => s.length))

    let col = 0
    while (col < maxLen) {
      const columnNotes: TabNote[] = []

      for (let strIdx = 0; strIdx < segment.length; strIdx++) {
        const ch = segment[strIdx][col]
        if (!ch || ch === '-' || ch === ' ') continue

        if (ch === 'x' || ch === 'X') {
          // Muted note
          columnNotes.push({
            string: strIdx + 1,
            fret: 0,
            duration: defaultDuration,
            technique: 'mute',
          })
          continue
        }

        if (ch === 'h' || ch === 'H') continue // skip technique markers
        if (ch === 'p' || ch === 'P') continue
        if (ch === '/' || ch === '\\') continue
        if (ch === 'b') continue
        if (ch === '~') continue

        // Try to parse a fret number (could be 1 or 2 digits)
        let fretStr = ch
        if (col + 1 < segment[strIdx].length) {
          const next = segment[strIdx][col + 1]
          if (next >= '0' && next <= '9') {
            fretStr += next
          }
        }

        const fret = parseInt(fretStr, 10)
        if (!isNaN(fret)) {
          // Look ahead/behind for technique markers
          let technique: TabNote['technique'] | undefined
          const after = segment[strIdx][col + fretStr.length]
          if (after === 'h' || after === 'H') technique = 'hammer'
          else if (after === 'p' || after === 'P') technique = 'pull'
          else if (after === '/' || after === '\\') technique = 'slide'
          else if (after === 'b') technique = 'bend'
          else if (after === '~') technique = 'vibrato'

          columnNotes.push({
            string: strIdx + 1,
            fret,
            duration: defaultDuration,
            technique,
          })
        }
      }

      if (columnNotes.length > 0) {
        beats.push(columnNotes.length === 1 ? columnNotes[0] : columnNotes)
      }

      col++
      // Skip ahead past multi-digit fret numbers
      while (col < maxLen) {
        let hasDigit = false
        for (let strIdx = 0; strIdx < segment.length; strIdx++) {
          const prev = segment[strIdx][col - 1]
          const curr = segment[strIdx][col]
          if (prev >= '0' && prev <= '9' && curr >= '0' && curr <= '9') {
            hasDigit = true
          }
        }
        if (hasDigit) col++
        else break
      }
    }

    if (beats.length > 0) {
      measures.push({ beats })
    }
  }

  return measures
}
