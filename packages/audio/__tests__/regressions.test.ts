import { describe, it, expect, vi, afterEach } from 'vitest'
import { GUITAR, BASS, UKULELE, BANJO } from '@tabkit/core'
import type { InstrumentConfig } from '@tabkit/core'
import { fretToMidi, openStringMidi } from '../src/pitch.js'
import { Synth } from '../src/synth.js'
import { TabAudio } from '../src/TabAudio.js'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('open string pitch', () => {
  it('keeps the standard tunings of the built-in instruments', () => {
    expect(openStringMidi(GUITAR)).toEqual([64, 59, 55, 50, 45, 40])
    expect(openStringMidi(BASS)).toEqual([43, 38, 33, 28])
    expect(openStringMidi(UKULELE)).toEqual([69, 64, 60, 67])
    expect(openStringMidi(BANJO)).toEqual([62, 59, 55, 50, 67])
  })

  it('honours a custom tuning on a built-in instrument (drop D)', () => {
    const dropD: InstrumentConfig = { ...GUITAR, tuning: ['E', 'B', 'G', 'D', 'A', 'D'] }
    expect(fretToMidi(dropD, 6, 0)).toBe(38)
    expect(fretToMidi(dropD, 5, 0)).toBe(45)
  })

  it('honours half-step-down and open tunings', () => {
    const ebStandard: InstrumentConfig = { ...GUITAR, tuning: ['Eb', 'Bb', 'Gb', 'Db', 'Ab', 'Eb'] }
    expect(openStringMidi(ebStandard)).toEqual([63, 58, 54, 49, 44, 39])
    const openG: InstrumentConfig = { ...GUITAR, tuning: ['D', 'B', 'G', 'D', 'G', 'D'] }
    expect(openStringMidi(openG)).toEqual([62, 59, 55, 50, 43, 38])
  })

  it('estimates octaves for unnamed instruments from the thickest string up', () => {
    const seven: InstrumentConfig = { strings: 7, frets: 24, tuning: ['E', 'B', 'G', 'D', 'A', 'E', 'B'] }
    expect(openStringMidi(seven)).toEqual([64, 59, 55, 50, 45, 40, 35])
    const unnamedSix: InstrumentConfig = { strings: 6, frets: 24, tuning: ['E', 'B', 'G', 'D', 'A', 'E'] }
    expect(openStringMidi(unnamedSix)).toEqual([64, 59, 55, 50, 45, 40])
  })

  it('takes labels with an octave literally', () => {
    const custom: InstrumentConfig = { strings: 2, frets: 12, tuning: ['A4', 'C2'] }
    expect(openStringMidi(custom)).toEqual([69, 36])
  })
})

function stubAudioContext() {
  const gains: Array<{ gain: { value: number; setValueAtTime: ReturnType<typeof vi.fn> } }> = []
  const param = () => ({
    value: 1,
    setValueAtTime: vi.fn(function (this: { value: number }, v: number) {
      this.value = v
    }),
    linearRampToValueAtTime: vi.fn(),
    exponentialRampToValueAtTime: vi.fn(),
  })
  const created = { count: 0 }
  class FakeAudioContext {
    currentTime = 0
    state = 'running'
    destination = {}
    constructor() {
      created.count++
    }
    createGain() {
      const node = { gain: param(), connect: vi.fn(), disconnect: vi.fn() }
      gains.push(node)
      return node
    }
    createOscillator() {
      return {
        type: 'sine',
        frequency: param(),
        detune: param(),
        connect: vi.fn(),
        disconnect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      }
    }
    resume() {}
    close() {}
  }
  vi.stubGlobal('AudioContext', FakeAudioContext)
  return { gains, created }
}

describe('Synth volume and mute', () => {
  it('does nothing (and does not throw) without Web Audio', () => {
    vi.stubGlobal('AudioContext', undefined)
    const synth = new Synth()
    expect(() => {
      synth.setVolume(0.5)
      synth.mute()
      synth.playTone(440, 0.1)
      synth.unmute()
    }).not.toThrow()
    expect(synth.context).toBeNull()
  })

  it('does not create an AudioContext until a tone is played', () => {
    const { created } = stubAudioContext()
    const synth = new Synth()
    synth.setVolume(0.3)
    synth.mute()
    synth.unmute()
    expect(created.count).toBe(0)
    synth.playTone(440, 0.1)
    expect(created.count).toBe(1)
  })

  it('unmute restores the volume that was set, not full volume', () => {
    const { gains } = stubAudioContext()
    const synth = new Synth()
    synth.setVolume(0.3)
    synth.playTone(440, 0.1)
    const master = gains[0]
    expect(master.gain.value).toBe(0.3)
    synth.mute()
    expect(master.gain.value).toBe(0)
    synth.unmute()
    expect(master.gain.value).toBe(0.3)
  })
})

describe('TabAudio volume', () => {
  it('applies the volume once (on the master), not again per note', () => {
    const { gains } = stubAudioContext()
    const audio = new TabAudio({ volume: 0.5 })
    const spy = vi.spyOn(Synth.prototype, 'playTone')
    audio.playNote({ string: 1, fret: 0, duration: '4n', accent: true })
    expect(gains[0].gain.value).toBe(0.5)
    expect(spy.mock.calls[0][2]).toMatchObject({ volume: 1 })
    audio.setVolume(0.2)
    expect(gains[0].gain.value).toBe(0.2)
    spy.mockRestore()
  })
})
