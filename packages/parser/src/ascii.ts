import type { TabMeasure, TabNote, TabBeat, Duration } from '@tabkit/core'
import type { AsciiParseOptions } from './types.js'

/** A string line: optional tuning label ("e", "Bb", "F#"), then a pipe and the content */
const STRING_LINE = /^\s*(?:[A-Ga-g][#b]?)?\s*\|(.*)$/

/** Two digits are read as one fret only up to this value ("12" → 12, "57" → 5 then 7) */
const MAX_TWO_DIGIT_FRET = 36

interface Token {
  /** First column of the token inside its measure segment */
  start: number
  /** Last column (inclusive) */
  end: number
  note: TabNote
}

function isDigit(ch: string | undefined): boolean {
  return ch !== undefined && ch >= '0' && ch <= '9'
}

function techniqueAfter(ch: string | undefined): TabNote['technique'] | undefined {
  switch (ch) {
    case 'h':
    case 'H':
      return 'hammer'
    case 'p':
    case 'P':
      return 'pull'
    case '/':
    case '\\':
    case 's':
    case 'S':
      return 'slide'
    case 'b':
      return 'bend'
    case '~':
      return 'vibrato'
    case 't':
    case 'T':
      return 'tap'
    default:
      return undefined
  }
}

/** Read every note of one string inside one measure segment */
function tokenizeString(segment: string, stringNum: number, duration: Duration): Token[] {
  const tokens: Token[] = []
  let col = 0

  while (col < segment.length) {
    const ch = segment[col]

    if (ch === 'x' || ch === 'X') {
      tokens.push({
        start: col,
        end: col,
        note: { string: stringNum, fret: 0, duration, technique: 'mute' },
      })
      col++
      continue
    }

    // Natural harmonic written as <12>
    if (ch === '<') {
      const close = segment.indexOf('>', col)
      const inner = close > col ? segment.slice(col + 1, close) : ''
      if (/^\d{1,2}$/.test(inner)) {
        tokens.push({
          start: col,
          end: close,
          note: { string: stringNum, fret: parseInt(inner, 10), duration, technique: 'harmonic' },
        })
        col = close + 1
        continue
      }
    }

    if (isDigit(ch)) {
      let text = ch
      if (isDigit(segment[col + 1]) && parseInt(ch + segment[col + 1], 10) <= MAX_TWO_DIGIT_FRET) {
        text += segment[col + 1]
      }
      const technique = techniqueAfter(segment[col + text.length])
      const note: TabNote = { string: stringNum, fret: parseInt(text, 10), duration }
      if (technique) note.technique = technique
      tokens.push({ start: col, end: col + text.length - 1, note })
      col += text.length
      continue
    }

    col++
  }

  return tokens
}

/** Parse one measure: `segment[i]` is the text of string `i + 1` */
function parseMeasure(segment: string[], duration: Duration): TabBeat[] {
  const tokens: Token[] = []
  for (let i = 0; i < segment.length; i++) {
    tokens.push(...tokenizeString(segment[i], i + 1, duration))
  }
  tokens.sort((a, b) => a.start - b.start || a.note.string - b.note.string)

  // Notes whose columns overlap are played together (handles "10" next to "3")
  const beats: TabBeat[] = []
  let group: Token[] = []
  let groupEnd = -1

  const flush = () => {
    if (group.length === 0) return
    const notes = group.map((t) => t.note).sort((a, b) => a.string - b.string)
    beats.push(notes.length === 1 ? notes[0] : notes)
    group = []
  }

  for (const token of tokens) {
    const sameString = group.some((t) => t.note.string === token.note.string)
    if (group.length > 0 && (token.start > groupEnd || sameString)) flush()
    if (group.length === 0) groupEnd = token.end
    else groupEnd = Math.max(groupEnd, token.end)
    group.push(token)
  }
  flush()

  return beats
}

/** Group consecutive string lines into systems (one row of tablature each) */
function splitSystems(input: string, stringsPerSystem?: number): string[][] {
  const systems: string[][] = []
  let current: string[] = []

  const close = () => {
    if (current.length > 0) systems.push(current)
    current = []
  }

  for (const raw of input.split(/\r?\n/)) {
    const match = raw.match(STRING_LINE)
    if (!match) {
      close()
      continue
    }
    current.push(match[1])
    if (stringsPerSystem && current.length === stringsPerSystem) close()
  }
  close()

  return systems
}

/**
 * Parse a block of ASCII tablature text into TabMeasure[].
 *
 * Supports the classic format, with any number of systems separated by a
 * blank line (or any non-tab line):
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
  const measures: TabMeasure[] = []

  for (const system of splitSystems(input, options?.strings)) {
    // Split every string by barlines; empty pieces come from "||" or the trailing "|"
    const perString = system.map((content) =>
      content.split('|').filter((s) => s.length > 0),
    )
    const measureCount = Math.max(...perString.map((s) => s.length))

    for (let mi = 0; mi < measureCount; mi++) {
      const segment = perString.map((s) => s[mi] ?? '')
      const beats = parseMeasure(segment, defaultDuration)
      if (beats.length > 0) measures.push({ beats })
    }
  }

  return measures
}
