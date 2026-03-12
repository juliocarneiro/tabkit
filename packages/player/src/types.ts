import type { TabMeasure, TabNote } from 'tabkit'
export type { TabMeasure, TabNote }

export interface PlayerOptions {
  tempo?: number
  loop?: boolean
  countIn?: boolean
  onBeat?: (measure: number, beat: number) => void
  onMeasure?: (measure: number) => void
  onNote?: (notes: TabNote[], measure: number, beat: number, tempo: number) => void
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
