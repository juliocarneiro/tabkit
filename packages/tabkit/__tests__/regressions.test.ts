import { describe, it, expect } from 'vitest'
import {
  TabRenderer,
  computeTabLayout,
  measureWidth,
  timeSignatureFlags,
  DEFAULT_LAYOUT,
  GUITAR,
  type TabMeasure,
  type TabNote,
} from '../src/index.js'

const n = (string: number, fret: number, duration: TabNote['duration'] = '4n', extra: Partial<TabNote> = {}): TabNote => ({
  string,
  fret,
  duration,
  ...extra,
})

const four = (): TabMeasure => ({ beats: [n(1, 0), n(1, 1), n(1, 2), n(1, 3)] })

const svgWidth = (svg: string) => Number(svg.match(/<svg[^>]* width="(\d+(?:\.\d+)?)"/)![1])
const maxX = (svg: string) =>
  Math.max(...[...svg.matchAll(/ x[12]?="(-?\d+(?:\.\d+)?)"/g)].map((m) => Number(m[1])))
const circles = (svg: string) =>
  [...svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)"/g)].map((m) => [Number(m[1]), Number(m[2])])

describe('layout never clips content', () => {
  it('fixed layout grows the SVG to fit a long single row', () => {
    const measures = Array.from({ length: 12 }, four)
    const svg = TabRenderer.svg({ measures, layout: 'fixed', width: 400 })
    expect(svgWidth(svg)).toBeGreaterThanOrEqual(maxX(svg))
    expect(svgWidth(svg)).toBeGreaterThan(400)
  })

  it('fixed layout without a width sizes to its content', () => {
    const svg = TabRenderer.svg({ measures: [four()], layout: 'fixed' })
    expect(svgWidth(svg)).toBeLessThan(800)
    expect(svgWidth(svg)).toBeGreaterThanOrEqual(maxX(svg))
  })

  it('reflow accounts for the time signature width', () => {
    const measures = Array.from({ length: 6 }, (): TabMeasure => ({ ...four(), timeSignature: [4, 4] }))
    for (let width = 300; width <= 700; width += 7) {
      const svg = TabRenderer.svg({ measures, width })
      expect(maxX(svg)).toBeLessThanOrEqual(svgWidth(svg))
      if (width >= 260) expect(svgWidth(svg)).toBe(width)
    }
  })

  it('computeTabLayout matches what the renderer draws', () => {
    const measures = Array.from({ length: 5 }, four)
    const layout = computeTabLayout({ measures, width: 420 })
    const svg = TabRenderer.svg({ measures, width: 420 })
    expect(layout.lines.length).toBeGreaterThan(1)
    expect(layout.lines.flatMap((l) => l.measures).map((b) => b.index)).toEqual([0, 1, 2, 3, 4])
    expect(svg).toContain(`height="${layout.height}"`)
    // First note of measure 0 is centred in its first beat
    const first = layout.lines[0].measures[0]
    expect(svg).toContain(`<text x="${first.contentX + DEFAULT_LAYOUT.beatWidth / 2}"`)
  })

  it('empty measures keep one beat of room in both measureWidth and the SVG', () => {
    const empty: TabMeasure = { beats: [] }
    const layout = computeTabLayout({ measures: [empty, empty] })
    const expected = DEFAULT_LAYOUT.barlinePadding * 2 + DEFAULT_LAYOUT.beatWidth
    expect(measureWidth(empty, DEFAULT_LAYOUT)).toBe(expected)
    expect(layout.lines[0].measures.map((b) => b.width)).toEqual([expected, expected])
  })

  it('short notes get a minimum slot so fret numbers do not overlap', () => {
    const measures: TabMeasure[] = [{ beats: [n(1, 10, '32n'), n(1, 12, '32n'), n(1, 14, '32n')] }]
    const xs = [...TabRenderer.svg({ measures }).matchAll(/<text x="([\d.]+)"[^>]*data-beat/g)].map((m) => Number(m[1]))
    expect(xs[1] - xs[0]).toBeGreaterThanOrEqual(16)
    expect(xs[2] - xs[1]).toBeGreaterThanOrEqual(16)
  })
})

describe('time signature', () => {
  it('is drawn where it starts or changes, not on every measure', () => {
    const measures: TabMeasure[] = [
      { ...four(), timeSignature: [4, 4] },
      { ...four(), timeSignature: [4, 4] },
      { beats: [n(1, 0), n(1, 1), n(1, 2)], timeSignature: [3, 4] },
      { beats: [n(1, 0), n(1, 1), n(1, 2)] },
    ]
    expect(timeSignatureFlags(measures)).toEqual([true, false, true, false])
    const svg = TabRenderer.svg({ measures })
    expect(svg.match(/tk-time-sig/g)).toHaveLength(2)
  })
})

describe('tuning gutter', () => {
  it('keeps labels inside the SVG and starts strings after them', () => {
    const svg = TabRenderer.svg({ measures: [four()] })
    const labelX = Number(svg.match(/<g class="tk-tuning"><text x="([\d.]+)"/)![1])
    const stringX = Number(svg.match(/<g class="tk-strings"><line x1="([\d.]+)"/)![1])
    // Right-aligned text: needs room on its left for a two-character label
    expect(labelX).toBeGreaterThanOrEqual(16)
    expect(stringX).toBeGreaterThan(labelX)
  })
})

describe('repeat signs', () => {
  it('draws the two dots at different heights', () => {
    const svg = TabRenderer.svg({ measures: [{ ...four(), repeat: { start: true } }, four()] })
    const dots = circles(svg)
    expect(dots).toHaveLength(2)
    expect(dots[0][1]).not.toBe(dots[1][1])
  })

  it('a single-measure repeat has one start sign and one end sign', () => {
    const svg = TabRenderer.svg({ measures: [{ ...four(), repeat: { start: true, end: true } }] })
    const dots = circles(svg)
    expect(dots).toHaveLength(4)
    const xs = [...new Set(dots.map((d) => d[0]))]
    expect(xs).toHaveLength(2)
  })

  it('puts the start sign on the measure that declares it', () => {
    const svg = TabRenderer.svg({ measures: [four(), { ...four(), repeat: { start: true, end: true, times: 4 } }] })
    const layout = computeTabLayout({ measures: [four(), { ...four(), repeat: { start: true } }] })
    const second = layout.lines[0].measures[1]
    const xs = [...new Set(circles(svg).map((d) => d[0]))].sort((a, b) => a - b)
    expect(xs).toEqual([second.x + 10, second.x + second.width - 10])
    expect(svg).toContain('x4')
  })
})

describe('left-handed note labels', () => {
  it('names the same pitch regardless of handedness', () => {
    const label = (leftHanded: boolean) =>
      TabRenderer.svg({ measures: [{ beats: [n(2, 1)] }], noteLabels: true, leftHanded }).match(
        /font-size="8"[^>]*>([^<]*)</,
      )![1]
    // String 2 (B) at fret 1 is a C
    expect(label(false)).toBe('C')
    expect(label(true)).toBe('C')
  })
})

describe('escaping', () => {
  it('escapes tuning labels', () => {
    const svg = TabRenderer.svg({
      measures: [{ beats: [n(1, 0)] }],
      instrument: { strings: 1, frets: 12, tuning: ['<script>alert(1)</script>'] },
    })
    expect(svg).not.toContain('<script>')
  })

  it('escapes theme values used in attributes', () => {
    const svg = TabRenderer.svg({
      measures: [{ beats: [n(1, 0)] }],
      theme: { textColor: '#000" onload="alert(1)', background: '#fff"><script>x</script>' },
    })
    expect(svg).not.toContain('onload="alert(1)"')
    expect(svg).not.toContain('<script>')
  })
})

describe('ids', () => {
  it('uses options.id for deterministic output', () => {
    const options = { measures: [four()], id: 'intro' }
    const a = TabRenderer.svg(options)
    expect(a).toBe(TabRenderer.svg(options))
    expect(a).toContain('id="tk-title-intro"')
    expect(a).toContain('aria-labelledby="tk-title-intro tk-desc-intro"')
  })
})

describe('note hit area', () => {
  it('tags the background box with the same data attributes as the number', () => {
    const svg = TabRenderer.svg({ measures: [{ beats: [n(3, 7)] }] })
    expect(svg).toMatch(/<rect[^>]*data-measure="0" data-beat="0" data-string="3" data-fret="7"/)
  })
})

describe('builder', () => {
  it('does not need a DOM to build an SVG string', () => {
    const svg = new TabRenderer().measures([four()]).instrument(GUITAR).toSvg()
    expect(svg.startsWith('<svg')).toBe(true)
  })
})
