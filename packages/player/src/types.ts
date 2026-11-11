import type { TabMeasure, TabNote } from '@tabkit/core'
export type { TabMeasure, TabNote }

export interface PlayerOptions {
  tempo?: number
  loop?: boolean
  countIn?: boolean
  onBeat?: (measure: number, beat: number) => void
  onMeasure?: (measure: number) => void
  onNote?: (notes: TabNote[], measure: number, beat: number, tempo: number) => void
  /** Fired on each count-in click: `beat` is 1-based, `total` the count-in length */
  onCountIn?: (beat: number, total: number) => void
  onEnd?: () => void
}

export interface PlayerState {
  isPlaying: boolean
  currentMeasure: number
  currentBeat: number
  tempo: number
  elapsedMs: number
}

export interface CursorPosition {
  lineIndex: number
  x: number
  measureIndex: number
  beatIndex: number
}
