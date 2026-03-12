export interface MetronomeOptions {
  tempo: number
  onTick?: () => void
  /** Enable built-in click sound via Web Audio API (default: true) */
  sound?: boolean
  /** Volume for the click sound (0–1, default: 0.5) */
  volume?: number
  /** Accent the first beat of each group (requires beatsPerMeasure) */
  accentFirst?: boolean
  /** Number of beats per measure — used for accent pattern */
  beatsPerMeasure?: number
}

/**
 * Drift-corrected metronome with optional built-in click sound.
 *
 * Uses Web Audio API to produce a short pitched click on each tick.
 * Beat 1 is accented at a higher pitch when `accentFirst` is enabled.
 */
export class Metronome {
  private _tempo: number
  private _onTick?: () => void
  private _timer: ReturnType<typeof setTimeout> | null = null
  private _nextTickTime = 0
  private _running = false

  private _sound: boolean
  private _volume: number
  private _accentFirst: boolean
  private _beatsPerMeasure: number
  private _beatCount = 0

  private _ctx: AudioContext | null = null

  constructor(options: MetronomeOptions) {
    this._tempo = options.tempo
    this._onTick = options.onTick
    this._sound = options.sound ?? true
    this._volume = options.volume ?? 0.5
    this._accentFirst = options.accentFirst ?? true
    this._beatsPerMeasure = options.beatsPerMeasure ?? 4
  }

  get tempo(): number {
    return this._tempo
  }

  set tempo(bpm: number) {
    this._tempo = Math.max(20, Math.min(400, bpm))
    if (this._running) {
      this._nextTickTime = performance.now() + this.intervalMs
    }
  }

  get intervalMs(): number {
    return (60 / this._tempo) * 1000
  }

  get isRunning(): boolean {
    return this._running
  }

  set volume(v: number) {
    this._volume = Math.max(0, Math.min(1, v))
  }

  get volume(): number {
    return this._volume
  }

  set beatsPerMeasure(n: number) {
    this._beatsPerMeasure = Math.max(1, n)
  }

  get beatsPerMeasure(): number {
    return this._beatsPerMeasure
  }

  start(): void {
    if (this._running) return
    this._running = true
    this._beatCount = 0
    this._nextTickTime = performance.now()
    this._scheduleTick()
  }

  stop(): void {
    this._running = false
    if (this._timer !== null) {
      clearTimeout(this._timer)
      this._timer = null
    }
  }

  /** Release the AudioContext. Call when you're done with the metronome. */
  destroy(): void {
    this.stop()
    if (this._ctx) {
      this._ctx.close()
      this._ctx = null
    }
  }

  private _ensureContext(): AudioContext | null {
    if (!this._ctx) {
      if (typeof AudioContext === 'undefined') return null
      this._ctx = new AudioContext()
    }
    if (this._ctx.state === 'suspended') {
      this._ctx.resume()
    }
    return this._ctx
  }

  private _playClick(accent: boolean): void {
    if (!this._sound) return

    const ctx = this._ensureContext()
    if (!ctx) return
    const now = ctx.currentTime

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    // Higher pitch + louder for accent, lower for normal beat
    osc.frequency.setValueAtTime(accent ? 1000 : 800, now)
    osc.type = 'sine'

    const vol = accent ? this._volume : this._volume * 0.6
    gain.gain.setValueAtTime(vol, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)

    osc.start(now)
    osc.stop(now + 0.05)

    osc.onended = () => {
      osc.disconnect()
      gain.disconnect()
    }
  }

  private _scheduleTick(): void {
    if (!this._running) return

    const isAccent = this._accentFirst && (this._beatCount % this._beatsPerMeasure === 0)
    this._playClick(isAccent)
    this._beatCount++

    this._onTick?.()
    this._nextTickTime += this.intervalMs
    const drift = performance.now() - this._nextTickTime
    const nextDelay = Math.max(1, this.intervalMs - drift)

    this._timer = setTimeout(() => this._scheduleTick(), nextDelay)
  }
}
