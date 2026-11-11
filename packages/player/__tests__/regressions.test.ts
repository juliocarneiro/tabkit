import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Metronome } from '../src/metronome.js'
import { TabPlayer } from '../src/TabPlayer.js'
import type { TabMeasure } from '@tabkit/core'

let fakeTime = 0

function advance(ms: number) {
  // Step in small slices so performance.now() tracks the timers
  for (let t = 0; t < ms; t += 1) {
    fakeTime += 1
    vi.advanceTimersByTime(1)
  }
}

beforeEach(() => {
  fakeTime = 0
  vi.useFakeTimers()
  vi.stubGlobal('performance', { now: vi.fn(() => fakeTime) })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

const quarter = (fret: number) => ({ string: 1, fret, duration: '4n' as const })

describe('Metronome timing', () => {
  it('ticks at an even interval from the very first beat', () => {
    const times: number[] = []
    const met = new Metronome({ tempo: 300, sound: false, onTick: () => times.push(fakeTime) })
    met.start()
    advance(1000)
    met.stop()
    expect(times).toEqual([0, 200, 400, 600, 800, 1000])
  })

  it('applies a tempo change from the next tick without a gap', () => {
    const times: number[] = []
    const met = new Metronome({ tempo: 300, sound: false, onTick: () => times.push(fakeTime) })
    met.start()
    advance(250)
    met.tempo = 400 // 150ms interval
    advance(350)
    met.stop()
    expect(times).toEqual([0, 200, 400, 550])
  })

  it('clamps the initial tempo', () => {
    expect(new Metronome({ tempo: 5, sound: false }).tempo).toBe(20)
    expect(new Metronome({ tempo: 9999, sound: false }).tempo).toBe(400)
  })
})

describe('TabPlayer', () => {
  it('inherits the time signature from earlier measures', () => {
    const measures: TabMeasure[] = [
      { beats: [quarter(0), quarter(1), quarter(2)], timeSignature: [3, 4] },
      { beats: [quarter(3), quarter(4), quarter(5)] },
    ]
    const beats: number[] = []
    let ended = -1
    const player = new TabPlayer(measures, {
      tempo: 600, // 100ms per quarter
      onBeat: () => beats.push(fakeTime),
      onEnd: () => {
        ended = fakeTime
      },
    })
    player.play()
    advance(700)
    // Six quarter notes back to back, no padding rest after the second measure
    expect(beats).toEqual([0, 100, 200, 300, 400, 500])
    expect(ended).toBe(600)
  })

  it('setLoop toggles looping on a live player', () => {
    const measures: TabMeasure[] = [{ beats: [quarter(0), quarter(1), quarter(2), quarter(3)] }]
    let ended = false
    const player = new TabPlayer(measures, { tempo: 600, onEnd: () => (ended = true) })
    player.setLoop(true)
    player.play()
    advance(900)
    expect(ended).toBe(false)
    expect(player.isPlaying).toBe(true)
    player.setLoop(false)
    advance(500)
    expect(ended).toBe(true)
  })

  it('reports count-in clicks', () => {
    const measures: TabMeasure[] = [{ beats: [quarter(0)], timeSignature: [3, 4] }]
    const clicks: Array<[number, number]> = []
    const player = new TabPlayer(measures, {
      tempo: 600,
      countIn: true,
      onCountIn: (beat, total) => clicks.push([beat, total]),
    })
    player.play()
    advance(350)
    player.stop()
    expect(clicks).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ])
  })
})
