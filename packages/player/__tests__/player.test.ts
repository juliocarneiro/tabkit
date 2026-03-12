import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Metronome } from '../src/metronome.js'
import { TabPlayer } from '../src/TabPlayer.js'
import type { TabMeasure } from '@tabkit/core'

let fakeTime = 0

function advance(ms: number) {
  fakeTime += ms
  vi.advanceTimersByTime(ms)
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

// ---------------------------------------------------------------------------
// Metronome
// ---------------------------------------------------------------------------

describe('Metronome', () => {
  it('fires onTick on start', () => {
    const ticks: number[] = []
    let count = 0
    const met = new Metronome({
      tempo: 120,
      onTick: () => {
        ticks.push(count++)
      },
    })

    met.start()
    expect(ticks.length).toBe(1)
    met.stop()
  })

  it('calculates correct interval', () => {
    const met = new Metronome({ tempo: 120, onTick: () => {} })
    expect(met.intervalMs).toBe(500)
  })

  it('clamps tempo', () => {
    const met = new Metronome({ tempo: 120, onTick: () => {} })
    met.tempo = 10
    expect(met.tempo).toBe(20)
    met.tempo = 500
    expect(met.tempo).toBe(400)
  })

  it('reports running state', () => {
    const met = new Metronome({ tempo: 120, onTick: () => {} })
    expect(met.isRunning).toBe(false)
    met.start()
    expect(met.isRunning).toBe(true)
    met.stop()
    expect(met.isRunning).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// TabPlayer
// ---------------------------------------------------------------------------

const sampleMeasures: TabMeasure[] = [
  {
    beats: [
      { string: 6, fret: 0, duration: '4n' },
      { string: 6, fret: 3, duration: '4n' },
      { string: 5, fret: 0, duration: '4n' },
      { string: 5, fret: 2, duration: '4n' },
    ],
    timeSignature: [4, 4],
  },
  {
    beats: [
      { string: 4, fret: 0, duration: '4n' },
      { string: 3, fret: 2, duration: '4n' },
    ],
  },
]

describe('TabPlayer', () => {
  it('initializes with correct defaults', () => {
    const player = new TabPlayer(sampleMeasures)
    expect(player.isPlaying).toBe(false)
    expect(player.currentMeasure).toBe(0)
    expect(player.currentBeat).toBe(0)
  })

  it('starts and stops playback', () => {
    const player = new TabPlayer(sampleMeasures, { tempo: 120 })
    player.play()
    expect(player.isPlaying).toBe(true)
    player.stop()
    expect(player.isPlaying).toBe(false)
  })

  it('fires onBeat callback on play', () => {
    const beats: [number, number][] = []
    const player = new TabPlayer(sampleMeasures, {
      tempo: 120,
      onBeat: (m, b) => beats.push([m, b]),
    })
    player.play()
    expect(beats.length).toBe(1)
    expect(beats[0]).toEqual([0, 0])
    player.stop()
  })

  it('advances through beats with timers', () => {
    const beats: [number, number][] = []
    const player = new TabPlayer(sampleMeasures, {
      tempo: 120,
      onBeat: (m, b) => beats.push([m, b]),
    })
    player.play()
    expect(beats).toEqual([[0, 0]])

    // Advance past the first beat duration (500ms for quarter note at 120 BPM)
    advance(510)
    expect(beats).toEqual([[0, 0], [0, 1]])

    advance(510)
    expect(beats).toEqual([[0, 0], [0, 1], [0, 2]])

    player.stop()
  })

  it('fires onMeasure at beat 0', () => {
    const measures: number[] = []
    const player = new TabPlayer(sampleMeasures, {
      tempo: 120,
      onMeasure: (m) => measures.push(m),
    })
    player.play()
    expect(measures).toEqual([0])

    // Advance through remaining 3 beats of measure 0
    advance(510)
    advance(510)
    advance(510)
    // Now at measure 1
    advance(510)
    expect(measures).toEqual([0, 1])

    player.stop()
  })

  it('fires onEnd when playback finishes', () => {
    let ended = false
    const player = new TabPlayer(sampleMeasures, {
      tempo: 120,
      onEnd: () => { ended = true },
    })
    player.play()

    // 6 beats total (4 + 2), each 500ms at 120 BPM
    for (let i = 0; i < 6; i++) {
      advance(510)
    }

    expect(ended).toBe(true)
    expect(player.isPlaying).toBe(false)
  })

  it('loops when loop is enabled', () => {
    const beats: [number, number][] = []
    const player = new TabPlayer(sampleMeasures, {
      tempo: 120,
      loop: true,
      onBeat: (m, b) => beats.push([m, b]),
    })
    player.play()

    // Advance through all 6 beats + 1 more
    for (let i = 0; i < 7; i++) {
      advance(510)
    }

    // Should have looped back to measure 0, beat 0
    const lastBeat = beats[beats.length - 1]
    expect(lastBeat[0]).toBe(0) // measure 0

    player.stop()
  })

  it('pauses without resetting position', () => {
    const player = new TabPlayer(sampleMeasures, { tempo: 120 })
    player.play()
    advance(510)
    player.pause()
    expect(player.isPlaying).toBe(false)
    expect(player.currentBeat).toBe(1)
  })

  it('seek moves to correct position', () => {
    const player = new TabPlayer(sampleMeasures)
    player.seek(1, 0)
    expect(player.currentMeasure).toBe(1)
    expect(player.currentBeat).toBe(0)
  })

  it('setTempo updates tempo', () => {
    const player = new TabPlayer(sampleMeasures, { tempo: 120 })
    player.setTempo(180)
    expect(player.state.tempo).toBe(180)
  })

  it('setTempo clamps values', () => {
    const player = new TabPlayer(sampleMeasures)
    player.setTempo(5)
    expect(player.state.tempo).toBe(20)
    player.setTempo(999)
    expect(player.state.tempo).toBe(400)
  })

  it('destroy stops everything', () => {
    const player = new TabPlayer(sampleMeasures, { tempo: 120 })
    player.play()
    player.destroy()
    expect(player.isPlaying).toBe(false)
  })

  it('state snapshot is immutable', () => {
    const player = new TabPlayer(sampleMeasures)
    const state1 = player.state
    player.play()
    const state2 = player.state
    expect(state1.isPlaying).toBe(false)
    expect(state2.isPlaying).toBe(true)
  })

  it('does not play with empty measures', () => {
    const beats: [number, number][] = []
    const player = new TabPlayer([], {
      onBeat: (m, b) => beats.push([m, b]),
    })
    player.play()
    expect(player.isPlaying).toBe(false)
    expect(beats.length).toBe(0)
  })

  it('handles eighth notes with shorter intervals', () => {
    const eighthMeasure: TabMeasure[] = [
      {
        beats: [
          { string: 1, fret: 0, duration: '8n' },
          { string: 1, fret: 2, duration: '8n' },
          { string: 1, fret: 3, duration: '4n' },
        ],
      },
    ]

    const beats: [number, number][] = []
    const player = new TabPlayer(eighthMeasure, {
      tempo: 120,
      onBeat: (m, b) => beats.push([m, b]),
    })

    player.play()
    expect(beats).toEqual([[0, 0]])

    // 8th note = 250ms at 120 BPM
    advance(260)
    expect(beats).toEqual([[0, 0], [0, 1]])

    // Another 8th note
    advance(260)
    expect(beats).toEqual([[0, 0], [0, 1], [0, 2]])

    player.stop()
  })
})
