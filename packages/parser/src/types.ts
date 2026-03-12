export type { TabNote, TabBeat, TabMeasure, Duration } from '@tabkit/core'

export interface AsciiParseOptions {
  /** Default duration for parsed notes (default: '8n') */
  defaultDuration?: import('@tabkit/core').Duration
}

export interface MusicXMLParseOptions {
  /** Only parse the first N measures */
  maxMeasures?: number
}
