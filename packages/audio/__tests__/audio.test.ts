import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fretToMidi, midiToFrequency, fretToFrequency, TUNING_MIDI } from '../src/pitch.js'
import { applyEnvelope, PLUCK_ENVELOPE } from '../src/envelope.js'
import type { InstrumentConfig } from 'tabkit'

const GUITAR: InstrumentConfig = {
  strings: 6,
  frets: 24,
  tuning: ['E', 'B', 'G', 'D', 'A', 'E'],
  name: 'guitar',
}

const BASS: InstrumentConfig = {
  strings: 4,
  frets: 24,
  tuning: ['G', 'D', 'A', 'E'],
  name: 'bass',
}

describe('pitch', () => {
  describe('fretToMidi', () => {
    it('open string 1 (high E) on guitar = MIDI 64', () => {
      expect(fretToMidi(GUITAR, 1, 0)).toBe(64)
    })

    it('open string 6 (low E) on guitar = MIDI 40', () => {
      expect(fretToMidi(GUITAR, 6, 0)).toBe(40)
    })

    it('open string 5 (A) on guitar = MIDI 45', () => {
      expect(fretToMidi(GUITAR, 5, 0)).toBe(45)
    })

    it('fret 5 on string 6 = A2 = MIDI 45', () => {
      expect(fretToMidi(GUITAR, 6, 5)).toBe(45)
    })

    it('fret 12 on string 1 = E5 = MIDI 76', () => {
      expect(fretToMidi(GUITAR, 1, 12)).toBe(76)
    })

    it('open string 1 on bass = MIDI 43', () => {
      expect(fretToMidi(BASS, 1, 0)).toBe(43)
    })

    it('open string 4 on bass = MIDI 28', () => {
      expect(fretToMidi(BASS, 4, 0)).toBe(28)
    })
  })

  describe('midiToFrequency', () => {
    it('MIDI 69 = A4 = 440Hz', () => {
      expect(midiToFrequency(69)).toBeCloseTo(440, 2)
    })

    it('MIDI 60 = C4 ≈ 261.63Hz', () => {
      expect(midiToFrequency(60)).toBeCloseTo(261.63, 1)
    })

    it('MIDI 57 = A3 = 220Hz', () => {
      expect(midiToFrequency(57)).toBeCloseTo(220, 2)
    })

    it('MIDI 81 = A5 = 880Hz', () => {
      expect(midiToFrequency(81)).toBeCloseTo(880, 2)
    })
  })

  describe('fretToFrequency', () => {
    it('open high E on guitar ≈ 329.63Hz', () => {
      expect(fretToFrequency(GUITAR, 1, 0)).toBeCloseTo(329.63, 0)
    })

    it('open low E on guitar ≈ 82.41Hz', () => {
      expect(fretToFrequency(GUITAR, 6, 0)).toBeCloseTo(82.41, 0)
    })
  })

  describe('TUNING_MIDI', () => {
    it('guitar has 6 strings', () => {
      expect(TUNING_MIDI.guitar).toHaveLength(6)
    })

    it('bass has 4 strings', () => {
      expect(TUNING_MIDI.bass).toHaveLength(4)
    })

    it('ukulele has 4 strings', () => {
      expect(TUNING_MIDI.ukulele).toHaveLength(4)
    })

    it('banjo has 5 strings', () => {
      expect(TUNING_MIDI.banjo).toHaveLength(5)
    })
  })
})

describe('envelope', () => {
  it('PLUCK_ENVELOPE has correct shape', () => {
    expect(PLUCK_ENVELOPE).toEqual({
      attack: 0.003,
      decay: 0.15,
      sustain: 0.15,
      release: 0.3,
    })
  })

  it('applyEnvelope schedules gain ramps and returns end time', () => {
    const setValueAtTime = vi.fn()
    const linearRampToValueAtTime = vi.fn()
    const exponentialRampToValueAtTime = vi.fn()
    const gain = {
      gain: { setValueAtTime, linearRampToValueAtTime, exponentialRampToValueAtTime },
    } as unknown as GainNode

    const endTime = applyEnvelope(gain, PLUCK_ENVELOPE, 0, 0.5, 0.7)

    expect(setValueAtTime).toHaveBeenCalled()
    expect(linearRampToValueAtTime).toHaveBeenCalled()
    expect(exponentialRampToValueAtTime).toHaveBeenCalled()
    expect(endTime).toBeGreaterThan(0.5)
  })
})
