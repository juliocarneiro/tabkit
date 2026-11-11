export type { TabNote, TabBeat, TabMeasure, Duration } from '@tabkit/core'

export interface AsciiParseOptions {
  /** Default duration for parsed notes (default: '8n') */
  defaultDuration?: import('@tabkit/core').Duration
  /**
   * Number of strings per system. Only needed when systems are stacked with
   * no blank line between them; otherwise systems are detected automatically.
   */
  strings?: number
}

export interface MusicXMLParseOptions {
  /** Only parse the first N measures */
  maxMeasures?: number
}
