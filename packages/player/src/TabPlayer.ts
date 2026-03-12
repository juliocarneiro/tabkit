import type { TabMeasure } from 'tabkit'
import { flattenBeat, durationToBeats } from 'tabkit'
import type { PlayerOptions, PlayerState } from './types.js'
import { CursorSync } from './cursor-sync.js'

interface BeatPosition {
  measure: number
  beat: number
  durationBeats: number
}

/**
 * TabPlayer orchestrates playback of a tablature.
 *
 * It builds a flat list of every beat across all measures, then steps through
 * them using setTimeout with variable delays proportional to each beat's
 * rhythmic duration.
 */
export class TabPlayer {
  private _measures: TabMeasure[]
  private _options: {
    tempo: number
    loop: boolean
    countIn: boolean
    onBeat?: (measure: number, beat: number) => void
    onMeasure?: (measure: number) => void
    onNote?: (notes: import('tabkit').TabNote[], measure: number, beat: number, tempo: number) => void
    onEnd?: () => void
  }
  private _cursor = new CursorSync()
  private _state: PlayerState

  private _beatMap: BeatPosition[] = []
  private _index = 0
  private _pendingTimer: ReturnType<typeof setTimeout> | null = null
  private _countInRemaining = 0
  private _nextTickTime = 0

  constructor(measures: TabMeasure[], options?: PlayerOptions) {
    this._measures = measures
    this._options = {
      tempo: options?.tempo ?? 120,
      loop: options?.loop ?? false,
      countIn: options?.countIn ?? false,
      onBeat: options?.onBeat,
      onMeasure: options?.onMeasure,
      onNote: options?.onNote,
      onEnd: options?.onEnd,
    }

    this._state = {
      isPlaying: false,
      currentMeasure: 0,
      currentBeat: 0,
      tempo: this._options.tempo,
      elapsedMs: 0,
    }

    this._buildBeatMap()
  }

  // -- Public getters -------------------------------------------------------

  get state(): Readonly<PlayerState> {
    return { ...this._state }
  }

  get isPlaying(): boolean {
    return this._state.isPlaying
  }

  get currentMeasure(): number {
    return this._state.currentMeasure
  }

  get currentBeat(): number {
    return this._state.currentBeat
  }

  // -- SVG attachment -------------------------------------------------------

  attachSvg(svg: SVGSVGElement): void {
    this._cursor.attach(svg)
  }

  detachSvg(): void {
    this._cursor.detach()
  }

  // -- Transport controls ---------------------------------------------------

  play(): void {
    if (this._state.isPlaying) return
    if (this._beatMap.length === 0) return
    this._state.isPlaying = true

    this._nextTickTime = performance.now()

    if (this._options.countIn && this._index === 0) {
      const ts = this._measures[0]?.timeSignature
      this._countInRemaining = ts ? ts[0] : 4
      this._runCountIn()
    } else {
      this._advance()
    }
  }

  pause(): void {
    this._state.isPlaying = false
    this._clearPending()
  }

  stop(): void {
    this._state.isPlaying = false
    this._clearPending()
    this._index = 0
    this._state.currentMeasure = 0
    this._state.currentBeat = 0
    this._state.elapsedMs = 0
    this._cursor.hide()
  }

  seek(measure: number, beat: number): void {
    const idx = this._beatMap.findIndex(
      (bp) => bp.measure === measure && bp.beat === beat,
    )
    if (idx >= 0) {
      this._index = idx
      this._state.currentMeasure = measure
      this._state.currentBeat = beat
      this._cursor.highlightBeat(measure, beat)
    }
  }

  setTempo(bpm: number): void {
    this._options.tempo = Math.max(20, Math.min(400, bpm))
    this._state.tempo = this._options.tempo
  }

  destroy(): void {
    this.stop()
    this._cursor.detach()
  }

  // -- Internal -------------------------------------------------------------

  private _buildBeatMap(): void {
    this._beatMap = []
    for (let mi = 0; mi < this._measures.length; mi++) {
      const m = this._measures[mi]
      for (let bi = 0; bi < m.beats.length; bi++) {
        const notes = flattenBeat(m.beats[bi])
        const durations = notes.map((n) => durationToBeats(n.duration))
        const dur = durations.length > 0 ? Math.max(...durations) : 1
        this._beatMap.push({ measure: mi, beat: bi, durationBeats: dur })
      }
    }
  }

  /**
   * Fire the current beat and schedule the next one.
   * The delay until the next beat is `durationBeats * quarterNoteMs`.
   */
  private _advance(): void {
    if (!this._state.isPlaying) return

    if (this._index >= this._beatMap.length) {
      if (this._options.loop) {
        this._index = 0
      } else {
        const wasPlaying = this._state.isPlaying
        this.stop()
        if (wasPlaying) this._options.onEnd?.()
        return
      }
    }

    const bp = this._beatMap[this._index]
    if (!bp) return

    // Update state
    this._state.currentMeasure = bp.measure
    this._state.currentBeat = bp.beat

    const quarterNoteMs = (60 / this._options.tempo) * 1000
    const beatMs = bp.durationBeats * quarterNoteMs
    this._state.elapsedMs += beatMs

    // Fire callbacks
    this._options.onBeat?.(bp.measure, bp.beat)
    if (bp.beat === 0) {
      this._options.onMeasure?.(bp.measure)
    }

    // Audio: fire with actual note data for this beat
    if (this._options.onNote) {
      const notes = flattenBeat(this._measures[bp.measure].beats[bp.beat])
      this._options.onNote(notes, bp.measure, bp.beat, this._options.tempo)
    }

    // Visual feedback
    this._cursor.highlightBeat(bp.measure, bp.beat)

    this._index++

    // Schedule next beat with duration-proportional delay
    this._scheduleNextWithDelay(beatMs)
  }

  private _runCountIn(): void {
    if (!this._state.isPlaying) return
    if (this._countInRemaining <= 0) {
      this._advance()
      return
    }
    this._countInRemaining--
    const quarterMs = (60 / this._options.tempo) * 1000
    this._nextTickTime += quarterMs
    const delay = Math.max(1, this._nextTickTime - performance.now())
    this._pendingTimer = setTimeout(() => this._runCountIn(), delay)
  }

  private _scheduleNextWithDelay(beatMs: number): void {
    this._clearPending()
    if (!this._state.isPlaying) return

    this._nextTickTime += beatMs
    const delay = Math.max(1, this._nextTickTime - performance.now())
    this._pendingTimer = setTimeout(() => this._advance(), delay)
  }

  private _clearPending(): void {
    if (this._pendingTimer !== null) {
      clearTimeout(this._pendingTimer)
      this._pendingTimer = null
    }
  }
}
