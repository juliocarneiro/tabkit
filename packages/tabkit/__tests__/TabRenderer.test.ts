import { describe, it, expect } from 'vitest'
import {
  TabRenderer,
  resolveInstrument,
  durationToBeats,
  flattenBeat,
  measureDurationBeats,
  mirrorMeasures,
  generateAriaTitle,
  generateAriaDescription,
  GUITAR,
  BASS,
  UKULELE,
  DEFAULT_LAYOUT,
} from '../src/index.js'
import { resolveTheme, lightTheme, darkTheme } from '../src/themes/index.js'
import { reflowMeasures } from '../src/layout/reflow.js'
import { measureWidth } from '../src/layout/horizontal.js'
import type { TabMeasure, TabNote } from '../src/types.js'

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const sampleMeasure: TabMeasure = {
  beats: [
    { string: 6, fret: 0, duration: '4n' },
    { string: 6, fret: 3, duration: '8n' },
    { string: 5, fret: 0, duration: '8n' },
    { string: 5, fret: 2, duration: '4n' },
  ],
  timeSignature: [4, 4],
  tempo: 120,
}

const chordBeat: TabNote[] = [
  { string: 1, fret: 0, duration: '4n' },
  { string: 2, fret: 1, duration: '4n' },
  { string: 3, fret: 0, duration: '4n' },
  { string: 4, fret: 2, duration: '4n' },
  { string: 5, fret: 3, duration: '4n' },
]

// ---------------------------------------------------------------------------
// Instrument resolution
// ---------------------------------------------------------------------------

describe('resolveInstrument', () => {
  it('returns guitar by default', () => {
    expect(resolveInstrument()).toEqual(GUITAR)
  })

  it('resolves preset strings', () => {
    expect(resolveInstrument('bass')).toEqual(BASS)
    expect(resolveInstrument('ukulele')).toEqual(UKULELE)
  })

  it('passes through custom config', () => {
    const custom = { strings: 7, frets: 24, tuning: ['B', 'E', 'A', 'D', 'G', 'B', 'E'] }
    expect(resolveInstrument(custom)).toEqual(custom)
  })
})

// ---------------------------------------------------------------------------
// Theme resolution
// ---------------------------------------------------------------------------

describe('resolveTheme', () => {
  it('returns light by default', () => {
    expect(resolveTheme()).toEqual(lightTheme)
  })

  it('resolves dark preset', () => {
    expect(resolveTheme('dark')).toEqual(darkTheme)
  })

  it('merges partial theme with light base', () => {
    const result = resolveTheme({ background: '#ff0000' })
    expect(result.background).toBe('#ff0000')
    expect(result.stringColor).toBe(lightTheme.stringColor)
  })
})

// ---------------------------------------------------------------------------
// Utility functions
// ---------------------------------------------------------------------------

describe('durationToBeats', () => {
  it('converts standard durations', () => {
    expect(durationToBeats('1n')).toBe(4)
    expect(durationToBeats('2n')).toBe(2)
    expect(durationToBeats('4n')).toBe(1)
    expect(durationToBeats('8n')).toBe(0.5)
    expect(durationToBeats('16n')).toBe(0.25)
  })
})

describe('flattenBeat', () => {
  it('wraps a single note in array', () => {
    const note: TabNote = { string: 1, fret: 5, duration: '4n' }
    expect(flattenBeat(note)).toEqual([note])
  })

  it('returns array as-is for chords', () => {
    expect(flattenBeat(chordBeat)).toBe(chordBeat)
  })
})

describe('measureDurationBeats', () => {
  it('sums beat durations', () => {
    const dur = measureDurationBeats(sampleMeasure)
    // 1 + 0.5 + 0.5 + 1 = 3
    expect(dur).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Left-handed mirroring
// ---------------------------------------------------------------------------

describe('mirrorMeasures', () => {
  it('flips string numbers for guitar', () => {
    const measures: TabMeasure[] = [
      {
        beats: [{ string: 1, fret: 5, duration: '4n' }],
      },
    ]
    const mirrored = mirrorMeasures(measures, GUITAR)
    const note = mirrored[0].beats[0] as TabNote
    expect(note.string).toBe(6) // 6 - 1 + 1
  })

  it('flips chord notes', () => {
    const measures: TabMeasure[] = [
      { beats: [chordBeat] },
    ]
    const mirrored = mirrorMeasures(measures, GUITAR)
    const notes = mirrored[0].beats[0] as TabNote[]
    expect(notes[0].string).toBe(6) // string 1 → 6
    expect(notes[4].string).toBe(2) // string 5 → 2
  })
})

// ---------------------------------------------------------------------------
// Layout / Reflow
// ---------------------------------------------------------------------------

describe('measureWidth', () => {
  it('returns a positive width', () => {
    const w = measureWidth(sampleMeasure, DEFAULT_LAYOUT)
    expect(w).toBeGreaterThan(0)
  })
})

describe('reflowMeasures', () => {
  it('puts all measures on one line when width is large', () => {
    const measures = [sampleMeasure, sampleMeasure]
    const result = reflowMeasures(measures, GUITAR, DEFAULT_LAYOUT, 2000)
    expect(result.lines.length).toBe(1)
    expect(result.lines[0].measures.length).toBe(2)
  })

  it('breaks into multiple lines when width is small', () => {
    const measures = Array.from({ length: 8 }, () => sampleMeasure)
    const result = reflowMeasures(measures, GUITAR, DEFAULT_LAYOUT, 300)
    expect(result.lines.length).toBeGreaterThan(1)
  })
})

// ---------------------------------------------------------------------------
// Accessibility
// ---------------------------------------------------------------------------

describe('accessibility', () => {
  it('generateAriaTitle uses custom title', () => {
    const title = generateAriaTitle(
      { measures: [sampleMeasure], ariaTitle: 'My riff' },
      GUITAR,
    )
    expect(title).toBe('My riff')
  })

  it('generateAriaTitle auto-generates from instrument', () => {
    const title = generateAriaTitle({ measures: [sampleMeasure] }, GUITAR)
    expect(title).toContain('guitar')
    expect(title).toContain('1 measure')
  })

  it('generateAriaDescription describes notes', () => {
    const desc = generateAriaDescription({ measures: [sampleMeasure] }, GUITAR)
    expect(desc).toContain('string 6 fret 0')
  })
})

// ---------------------------------------------------------------------------
// TabRenderer.svg
// ---------------------------------------------------------------------------

describe('TabRenderer.svg', () => {
  it('returns a valid SVG string', () => {
    const svg = TabRenderer.svg({
      measures: [sampleMeasure],
      instrument: 'guitar',
      theme: 'dark',
    })
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
    expect(svg).toContain('role="img"')
  })

  it('includes title and desc', () => {
    const svg = TabRenderer.svg({
      measures: [sampleMeasure],
      ariaTitle: 'Test Tab',
    })
    expect(svg).toContain('<title')
    expect(svg).toContain('Test Tab')
    expect(svg).toContain('<desc')
  })

  it('renders empty state gracefully', () => {
    const svg = TabRenderer.svg({ measures: [] })
    expect(svg).toContain('<svg')
    expect(svg).toContain('Empty tablature')
  })

  it('renders with left-handed mode', () => {
    const svg = TabRenderer.svg({
      measures: [sampleMeasure],
      leftHanded: true,
    })
    expect(svg).toContain('<svg')
  })

  it('renders chords (multiple notes per beat)', () => {
    const svg = TabRenderer.svg({
      measures: [{ beats: [chordBeat], timeSignature: [4, 4] }],
    })
    expect(svg).toContain('<svg')
  })

  it('renders technique decorations', () => {
    const svg = TabRenderer.svg({
      measures: [
        {
          beats: [
            { string: 3, fret: 5, duration: '8n', technique: 'hammer' },
            { string: 3, fret: 7, duration: '8n' },
          ],
        },
      ],
    })
    expect(svg).toContain('H')
  })

  it('renders time signature', () => {
    const svg = TabRenderer.svg({
      measures: [sampleMeasure],
      showTimeSignature: true,
    })
    expect(svg).toContain('tk-time-sig')
  })

  it('renders tuning labels', () => {
    const svg = TabRenderer.svg({
      measures: [sampleMeasure],
      showTuning: true,
    })
    expect(svg).toContain('tk-tuning')
  })

  it('handles repeat marks', () => {
    const svg = TabRenderer.svg({
      measures: [
        {
          ...sampleMeasure,
          repeat: { start: true, end: true, times: 4 },
        },
      ],
    })
    expect(svg).toContain('x4')
  })

  it('respects width option', () => {
    const svg = TabRenderer.svg({
      measures: [sampleMeasure],
      width: 500,
    })
    expect(svg).toContain('width="500"')
  })

  it('renders note labels when noteLabels is true', () => {
    const svg = TabRenderer.svg({
      measures: [sampleMeasure],
      noteLabels: true,
    })
    expect(svg).toContain('font-size="8"')
  })

  it('generates unique IDs across multiple renders', () => {
    const svg1 = TabRenderer.svg({ measures: [sampleMeasure] })
    const svg2 = TabRenderer.svg({ measures: [sampleMeasure] })
    const id1 = svg1.match(/id="(tk-title-\d+)"/)![1]
    const id2 = svg2.match(/id="(tk-title-\d+)"/)![1]
    expect(id1).not.toBe(id2)
  })

  it('respects showTuning: false', () => {
    const svg = TabRenderer.svg({
      measures: [sampleMeasure],
      showTuning: false,
    })
    expect(svg).not.toContain('tk-tuning')
  })
})

// ---------------------------------------------------------------------------
// TabRenderer.toSVGDataURL
// ---------------------------------------------------------------------------

describe('TabRenderer.toSVGDataURL', () => {
  it('returns a data URL', () => {
    const url = TabRenderer.toSVGDataURL({
      measures: [sampleMeasure],
    })
    expect(url).toMatch(/^data:image\/svg\+xml;base64,/)
  })
})
