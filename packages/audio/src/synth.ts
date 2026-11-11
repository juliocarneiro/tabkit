import type { EnvelopeParams } from './types.js'
import { PLUCK_ENVELOPE, applyEnvelope } from './envelope.js'

export interface ToneOptions {
  waveform?: OscillatorType
  volume?: number
  envelope?: EnvelopeParams
}

/**
 * Low-level synthesizer that manages an AudioContext and plays tones.
 * Lazy-initializes the AudioContext on first use (browser autoplay policy).
 * Supports polyphony — each call creates independent oscillator+gain nodes.
 *
 * For a more realistic guitar-like sound, each tone uses:
 * - A primary oscillator (triangle wave)
 * - A slightly detuned second oscillator (chorus effect)
 * - Natural micro-variation in pitch (humanize)
 * - Exponential envelope for pluck decay
 */
export class Synth {
  private _ctx: AudioContext | null = null
  private _master: GainNode | null = null
  private _volume = 1
  private _muted = false

  /** Lazily create the AudioContext. Returns null where Web Audio is unavailable (SSR, old browsers). */
  private _getCtx(): AudioContext | null {
    if (!this._ctx) {
      if (typeof AudioContext === 'undefined') return null
      this._ctx = new AudioContext()
      this._master = this._ctx.createGain()
      this._master.gain.value = this._muted ? 0 : this._volume
      this._master.connect(this._ctx.destination)
    }
    if (this._ctx.state === 'suspended') {
      this._ctx.resume()
    }
    return this._ctx
  }

  get context(): AudioContext | null {
    return this._ctx
  }

  /**
   * Play a single tone at the given frequency for the given duration.
   */
  playTone(
    frequency: number,
    durationSec: number,
    options?: ToneOptions,
  ): void {
    const ctx = this._getCtx()
    const master = this._master
    if (!ctx || !master) return
    const now = ctx.currentTime

    const waveform = options?.waveform ?? 'triangle'
    const volume = options?.volume ?? 0.7
    const envelope = options?.envelope ?? PLUCK_ENVELOPE

    // Slight random pitch variation (+/- 3 cents) for humanization
    const detuneCents = (Math.random() - 0.5) * 6
    const humanizedFreq = frequency * Math.pow(2, detuneCents / 1200)

    // Primary oscillator
    const osc1 = ctx.createOscillator()
    osc1.type = waveform
    osc1.frequency.setValueAtTime(humanizedFreq, now)

    // Secondary oscillator — detuned for chorus/richness
    const osc2 = ctx.createOscillator()
    osc2.type = waveform
    osc2.frequency.setValueAtTime(humanizedFreq, now)
    osc2.detune.setValueAtTime(7, now) // ~7 cents sharp

    // Mix: primary at full, secondary at 30%
    const gain1 = ctx.createGain()
    const gain2 = ctx.createGain()

    osc1.connect(gain1)
    osc2.connect(gain2)

    const mixGain = ctx.createGain()
    gain1.connect(mixGain)
    gain2.connect(mixGain)
    mixGain.connect(master)

    // Apply envelope to the mix
    const endTime = applyEnvelope(mixGain, envelope, now, durationSec, volume)

    // Set relative levels
    gain1.gain.setValueAtTime(1.0, now)
    gain2.gain.setValueAtTime(0.3, now)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(endTime + 0.05)
    osc2.stop(endTime + 0.05)

    osc1.onended = () => {
      osc1.disconnect()
      osc2.disconnect()
      gain1.disconnect()
      gain2.disconnect()
      mixGain.disconnect()
    }
  }

  /** Push the current volume/mute state to the master gain, if it exists yet. */
  private _applyGain(): void {
    if (this._master && this._ctx) {
      this._master.gain.setValueAtTime(
        this._muted ? 0 : this._volume,
        this._ctx.currentTime,
      )
    }
  }

  /**
   * Set master output volume (0–1). Does not create the AudioContext:
   * the value is remembered and applied on the first tone.
   */
  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume))
    this._applyGain()
  }

  get volume(): number {
    return this._volume
  }

  /** Mute output (sets master gain to 0). */
  mute(): void {
    this._muted = true
    this._applyGain()
  }

  /** Unmute output (restores the master volume). */
  unmute(): void {
    this._muted = false
    this._applyGain()
  }

  /** Close the AudioContext and release resources. */
  destroy(): void {
    if (this._ctx) {
      this._ctx.close()
      this._ctx = null
      this._master = null
    }
  }
}
