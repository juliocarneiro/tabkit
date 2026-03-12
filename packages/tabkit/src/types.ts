// ---------------------------------------------------------------------------
// Duration & Technique
// ---------------------------------------------------------------------------

export type Duration = '1n' | '2n' | '4n' | '8n' | '16n' | '32n' | '8t' | '4t'

export type Technique =
  | 'hammer'
  | 'pull'
  | 'slide'
  | 'bend'
  | 'vibrato'
  | 'mute'
  | 'tap'
  | 'harmonic'

// ---------------------------------------------------------------------------
// Note & Beat
// ---------------------------------------------------------------------------

export interface TabNote {
  /** String number (1 = thinnest / highest pitch) */
  string: number
  /** Fret number (0 = open string) */
  fret: number
  /** Rhythmic duration */
  duration: Duration
  /** Playing technique decoration */
  technique?: Technique
  /** Free-form label displayed on the note */
  text?: string
  /** Accent marker */
  accent?: boolean
  /** Tie to next note on the same string */
  tie?: boolean
}

/** A single beat is either one note or multiple simultaneous notes (chord) */
export type TabBeat = TabNote | TabNote[]

// ---------------------------------------------------------------------------
// Measure & Line
// ---------------------------------------------------------------------------

export interface RepeatMark {
  start?: boolean
  end?: boolean
  times?: number
}

export interface TabMeasure {
  beats: TabBeat[]
  timeSignature?: [number, number]
  tempo?: number
  label?: string
  repeat?: RepeatMark
}

/** A rendered line — a row of measures that fit within the available width */
export interface TabLine {
  measures: TabMeasure[]
  startMeasureIndex: number
}

// ---------------------------------------------------------------------------
// Instrument
// ---------------------------------------------------------------------------

export interface InstrumentConfig {
  strings: number
  frets: number
  tuning: string[]
  name?: string
}

export const GUITAR: InstrumentConfig = {
  strings: 6,
  frets: 24,
  tuning: ['E', 'B', 'G', 'D', 'A', 'E'],
  name: 'guitar',
}

export const BASS: InstrumentConfig = {
  strings: 4,
  frets: 24,
  tuning: ['G', 'D', 'A', 'E'],
  name: 'bass',
}

export const UKULELE: InstrumentConfig = {
  strings: 4,
  frets: 18,
  tuning: ['A', 'E', 'C', 'G'],
  name: 'ukulele',
}

export const BANJO: InstrumentConfig = {
  strings: 5,
  frets: 22,
  tuning: ['D', 'B', 'G', 'D', 'G'],
  name: 'banjo',
}

export type InstrumentPreset = 'guitar' | 'bass' | 'ukulele' | 'banjo'

const PRESETS: Record<InstrumentPreset, InstrumentConfig> = {
  guitar: GUITAR,
  bass: BASS,
  ukulele: UKULELE,
  banjo: BANJO,
}

export function resolveInstrument(
  input?: InstrumentPreset | InstrumentConfig,
): InstrumentConfig {
  if (!input) return GUITAR
  if (typeof input === 'string') return PRESETS[input] ?? GUITAR
  return input
}

// ---------------------------------------------------------------------------
// Theme
// ---------------------------------------------------------------------------

export interface TabTheme {
  background: string
  stringColor: string
  fretNumberColor: string
  barlineColor: string
  cursorColor: string
  textColor: string
  accentColor: string
  techniqueColor: string
  fontFamily: string
}

export type ThemePreset = 'light' | 'dark'

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

export interface TabOptions {
  measures: TabMeasure[]
  instrument?: InstrumentPreset | InstrumentConfig
  theme?: ThemePreset | Partial<TabTheme>
  layout?: 'responsive' | 'fixed'
  leftHanded?: boolean
  width?: number
  showTuning?: boolean
  showTimeSignature?: boolean
  noteLabels?: boolean
  onNoteClick?: (note: TabNote, measure: number, beat: number) => void
  ariaTitle?: string
  ariaDescription?: string
}

// ---------------------------------------------------------------------------
// Export options
// ---------------------------------------------------------------------------

export interface ExportOptions {
  scale?: number
  filename?: string
  format?: 'png' | 'svg'
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

export interface LayoutMetrics {
  stringSpacing: number
  beatWidth: number
  barlinePadding: number
  marginTop: number
  marginBottom: number
  marginLeft: number
  marginRight: number
  tuningWidth: number
  lineGap: number
}

export const DEFAULT_LAYOUT: LayoutMetrics = {
  stringSpacing: 16,
  beatWidth: 40,
  barlinePadding: 12,
  marginTop: 30,
  marginBottom: 20,
  marginLeft: 10,
  marginRight: 10,
  tuningWidth: 24,
  lineGap: 40,
}
