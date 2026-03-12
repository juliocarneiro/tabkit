import type { TabNote, InstrumentConfig, InstrumentPreset } from 'tabkit'
import { resolveInstrument, durationToBeats } from 'tabkit'
import type { AudioOptions } from './types.js'
import { fretToFrequency } from './pitch.js'
import { Synth } from './synth.js'

/**
 * High-level audio engine for tabkit.
 *
 * Converts TabNote data into synthesized sound via the Web Audio API.
 * Designed to be wired to `TabPlayer`'s `onNote` callback:
 *
 * ```ts
 * const audio = new TabAudio({ instrument: 'guitar' })
 * const player = new TabPlayer(measures, {
 *   onNote: (notes, _m, _b, tempo) => audio.playNotes(notes, tempo),
 * })
 * ```
 */
export class TabAudio {
  private _synth = new Synth()
  private _instrument: InstrumentConfig
  private _waveform: OscillatorType
  private _volume: number
  private _muted = false

  constructor(options?: AudioOptions) {
    this._instrument = resolveInstrument(options?.instrument)
    this._waveform = options?.waveform ?? 'triangle'
    this._volume = options?.volume ?? 0.7
  }

  /**
   * Play a single TabNote.
   * The note's duration is converted to seconds at an assumed 120 BPM
   * (for a more accurate duration, use `playNotes` with the player's tempo).
   */
  playNote(note: TabNote, tempo = 120): void {
    if (this._muted) return
    if (note.technique === 'mute') return

    const freq = fretToFrequency(this._instrument, note.string, note.fret)
    const beats = durationToBeats(note.duration)
    const durationSec = (beats * 60) / tempo

    this._synth.playTone(freq, durationSec, {
      waveform: this._waveform,
      volume: this._volume * (note.accent ? 1.0 : 0.8),
    })
  }

  /**
   * Play all notes in a beat simultaneously (supports chords).
   */
  playNotes(notes: TabNote[], tempo = 120): void {
    for (const note of notes) {
      this.playNote(note, tempo)
    }
  }

  /** Update the instrument config (changes pitch mapping). */
  setInstrument(instrument: InstrumentPreset | InstrumentConfig): void {
    this._instrument = resolveInstrument(instrument)
  }

  /** Set master volume (0–1). */
  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume))
    this._synth.setVolume(this._volume)
  }

  /** Set oscillator waveform for future notes. */
  setWaveform(waveform: OscillatorType): void {
    this._waveform = waveform
  }

  /** Mute all output. */
  mute(): void {
    this._muted = true
    this._synth.mute()
  }

  /** Unmute output. */
  unmute(): void {
    this._muted = false
    this._synth.unmute()
  }

  get isMuted(): boolean {
    return this._muted
  }

  get volume(): number {
    return this._volume
  }

  /** Close the AudioContext and release all resources. */
  destroy(): void {
    this._synth.destroy()
  }
}
