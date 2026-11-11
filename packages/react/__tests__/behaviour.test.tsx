import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createElement, StrictMode, act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import type { TabMeasure } from '@tabkit/core'
import { TabSheet, TabPlayer, TabEditor, useTabEditor, useTabPlayer } from '../src/index.js'
import type { UseTabEditorReturn, UseTabPlayerReturn } from '../src/index.js'

;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

let host: HTMLDivElement
let root: Root

beforeEach(() => {
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => root.unmount())
  host.remove()
  vi.useRealTimers()
})

const q = (fret: number) => ({ string: 1, fret, duration: '4n' as const })
const MEASURES: TabMeasure[] = [
  { beats: [q(0), q(1), q(2), q(3)] },
  { beats: [q(4), q(5), q(6), q(7)] },
]

describe('useTabEditor', () => {
  it('keeps undo/redo history consistent under StrictMode', () => {
    const onChange = vi.fn()
    let api!: UseTabEditorReturn
    function Probe() {
      api = useTabEditor({ initialMeasures: 1, onChange })
      return createElement('div', { ref: api.ref })
    }
    act(() => root.render(createElement(StrictMode, null, createElement(Probe))))

    const a: TabMeasure[] = [{ beats: [q(1)] }]
    const b: TabMeasure[] = [{ beats: [q(1), q(2)] }]
    act(() => api.setMeasures(a))
    act(() => api.setMeasures(b))
    expect(onChange).toHaveBeenCalledTimes(2)

    act(() => api.undo())
    expect(api.measures).toBe(a)
    expect(onChange).toHaveBeenCalledTimes(3)
    expect(api.canRedo).toBe(true)

    act(() => api.redo())
    expect(api.measures).toBe(b)
    expect(onChange).toHaveBeenCalledTimes(4)
    expect(api.canRedo).toBe(false)

    // Nothing left to redo: must be a no-op, not a replay of a duplicated entry
    act(() => api.redo())
    expect(api.measures).toBe(b)
    expect(onChange).toHaveBeenCalledTimes(4)

    act(() => api.undo())
    act(() => api.undo())
    expect(api.measures[0].beats).toEqual([])
    expect(api.canUndo).toBe(false)
  })
})

describe('useTabPlayer', () => {
  it('changes tempo and loop without stopping playback', () => {
    vi.useFakeTimers()
    let api!: UseTabPlayerReturn
    function Probe(props: { tempo: number; loop: boolean }) {
      api = useTabPlayer({ measures: MEASURES, tempo: props.tempo, loop: props.loop })
      return createElement('div', { ref: api.ref })
    }
    act(() => root.render(createElement(Probe, { tempo: 120, loop: false })))
    act(() => api.play())
    expect(api.isPlaying).toBe(true)

    act(() => root.render(createElement(Probe, { tempo: 200, loop: true })))
    expect(api.isPlaying).toBe(true)
    act(() => vi.advanceTimersByTime(600))
    expect(api.currentBeat).toBeGreaterThan(0)
  })

  it('resets isPlaying when the tab is re-rendered and the player replaced', () => {
    vi.useFakeTimers()
    let api!: UseTabPlayerReturn
    function Probe(props: { width: number }) {
      api = useTabPlayer({ measures: MEASURES, width: props.width })
      return createElement('div', { ref: api.ref })
    }
    act(() => root.render(createElement(Probe, { width: 800 })))
    act(() => api.play())
    expect(api.isPlaying).toBe(true)
    act(() => root.render(createElement(Probe, { width: 500 })))
    expect(api.isPlaying).toBe(false)
  })
})

describe('TabPlayer component', () => {
  it('keeps playing while the BPM slider moves', () => {
    vi.useFakeTimers()
    act(() => root.render(createElement(TabPlayer, { measures: MEASURES })))
    const button = () => host.querySelector('button') as HTMLButtonElement
    act(() => button().click())
    expect(button().textContent).toBe('Pause')

    const slider = host.querySelector('input[type="range"]') as HTMLInputElement
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    act(() => {
      setValue.call(slider, '200')
      slider.dispatchEvent(new Event('input', { bubbles: true }))
    })
    expect(host.textContent).toContain('200')
    expect(button().textContent).toBe('Pause')

    // The player really is still running: the position advances
    act(() => vi.advanceTimersByTime(700))
    expect(host.textContent).toMatch(/Beat [2-4]/)
  })
})

describe('note clicks', () => {
  it('fires for the fret number and for its background box', () => {
    const onNoteClick = vi.fn()
    act(() => root.render(createElement(TabSheet, { measures: MEASURES, onNoteClick })))
    const text = host.querySelector('text[data-measure="1"][data-beat="2"]')!
    const rect = host.querySelector('rect[data-measure="1"][data-beat="2"]')!
    act(() => text.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    act(() => rect.dispatchEvent(new MouseEvent('click', { bubbles: true })))
    expect(onNoteClick).toHaveBeenCalledTimes(2)
    expect(onNoteClick).toHaveBeenLastCalledWith(MEASURES[1].beats[2], 1, 2)
  })
})

describe('TabEditor', () => {
  it('adds the note to the measure that was actually clicked', () => {
    vi.useFakeTimers()
    const onChange = vi.fn()
    act(() => root.render(createElement(TabEditor, { measures: 4, width: 800, onChange })))
    act(() => vi.runOnlyPendingTimers())

    const svg = host.querySelector('svg')!
    // jsdom has no layout: report the SVG at its natural size
    svg.getBoundingClientRect = () =>
      ({ left: 0, top: 0, width: 800, height: 130, right: 800, bottom: 130, x: 0, y: 0, toJSON() {} }) as DOMRect

    // Empty measures are 64px wide starting at x=34: x=200 is the third one; y=62 is string 3
    const surface = svg.parentElement!
    act(() => surface.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: 200, clientY: 62 })))
    const input = host.querySelector('input') as HTMLInputElement
    expect(input).not.toBeNull()
    input.value = '7'
    act(() => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })))

    const updated = onChange.mock.calls[0][0] as TabMeasure[]
    expect(updated.map((m) => m.beats.length)).toEqual([0, 0, 1, 0])
    expect(updated[2].beats[0]).toEqual({ string: 3, fret: 7, duration: '8n' })
  })
})
