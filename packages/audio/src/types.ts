export type { TabNote, InstrumentConfig, InstrumentPreset } from 'tabkit'

export interface AudioOptions {
  /** Master volume (0–1). Default: 0.7 */
  volume?: number
  /** Oscillator waveform. Default: 'triangle' */
  waveform?: OscillatorType
  /** Instrument tuning — used to map string+fret to pitch */
  instrument?: import('tabkit').InstrumentPreset | import('tabkit').InstrumentConfig
}

export interface EnvelopeParams {
  attack: number
  decay: number
  sustain: number
  release: number
}
