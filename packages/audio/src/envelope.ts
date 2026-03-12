import type { EnvelopeParams } from './types.js'

/** Pluck envelope — fast attack, natural decay, short sustain */
export const PLUCK_ENVELOPE: EnvelopeParams = {
  attack: 0.003,
  decay: 0.15,
  sustain: 0.15,
  release: 0.3,
}

/**
 * Apply an ADSR envelope to a GainNode starting at `startTime`.
 *
 * Uses exponential ramps for the decay and release phases to model
 * the natural logarithmic decay of a plucked string.
 *
 * @returns The time when the envelope fully closes (for scheduling oscillator stop)
 */
export function applyEnvelope(
  gain: GainNode,
  envelope: EnvelopeParams,
  startTime: number,
  duration: number,
  volume: number,
): number {
  const g = gain.gain
  const { attack, decay, sustain, release } = envelope
  const floor = 0.0001

  g.setValueAtTime(floor, startTime)

  // Attack — linear ramp to peak
  g.linearRampToValueAtTime(volume, startTime + attack)

  // Decay — exponential fall to sustain level (sounds more natural)
  const sustainLevel = Math.max(volume * sustain, floor)
  g.exponentialRampToValueAtTime(sustainLevel, startTime + attack + decay)

  // Hold sustain until release point
  const releaseStart = startTime + Math.max(duration, attack + decay)
  g.setValueAtTime(sustainLevel, releaseStart)

  // Release — exponential fade to silence
  g.exponentialRampToValueAtTime(floor, releaseStart + release)

  return releaseStart + release
}
