import type { TabOptions, TabMeasure, InstrumentPreset, InstrumentConfig, ThemePreset, TabTheme, TabNote } from '@tabkit/core'
import type { CSSProperties } from 'react'

export interface TabSheetProps extends Omit<TabOptions, 'onNoteClick'> {
  className?: string
  style?: CSSProperties
  onNoteClick?: (note: TabNote, measure: number, beat: number) => void
}

export interface TabPlayerProps extends TabSheetProps {
  tempo?: number
  loop?: boolean
  countIn?: boolean
  showControls?: boolean
  onBeat?: (measure: number, beat: number) => void
  onNote?: (notes: TabNote[], measure: number, beat: number, tempo: number) => void
  onEnd?: () => void
}

export interface TabEditorProps {
  instrument?: InstrumentPreset | InstrumentConfig
  theme?: ThemePreset | Partial<TabTheme>
  measures?: number
  width?: number
  className?: string
  style?: CSSProperties
  onChange?: (measures: TabMeasure[]) => void
}

export interface UseTabPlayerOptions {
  measures: TabMeasure[]
  instrument?: InstrumentPreset | InstrumentConfig
  theme?: ThemePreset | Partial<TabTheme>
  tempo?: number
  loop?: boolean
  width?: number
  leftHanded?: boolean
  onBeat?: (measure: number, beat: number) => void
  onNote?: (notes: TabNote[], measure: number, beat: number, tempo: number) => void
  onEnd?: () => void
}

export interface UseTabPlayerReturn {
  ref: React.RefObject<HTMLDivElement | null>
  play: () => void
  pause: () => void
  stop: () => void
  seek: (measure: number, beat: number) => void
  isPlaying: boolean
  currentMeasure: number
  currentBeat: number
  setTempo: (bpm: number) => void
}

export interface UseTabEditorOptions {
  instrument?: InstrumentPreset | InstrumentConfig
  theme?: ThemePreset | Partial<TabTheme>
  initialMeasures?: number
  width?: number
  onChange?: (measures: TabMeasure[]) => void
}

export interface UseTabEditorReturn {
  ref: React.RefObject<HTMLDivElement | null>
  measures: TabMeasure[]
  setMeasures: (m: TabMeasure[]) => void
  clear: () => void
  undo: () => void
  redo: () => void
}
