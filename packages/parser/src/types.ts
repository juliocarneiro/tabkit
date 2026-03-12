export type { TabNote, TabBeat, TabMeasure, Duration } from 'tabkit'

export interface AsciiParseOptions {
  /** Default duration for parsed notes (default: '8n') */
  defaultDuration?: import('tabkit').Duration
}

export interface MusicXMLParseOptions {
  /** Only parse the first N measures */
  maxMeasures?: number
}
