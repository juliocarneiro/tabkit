import type {
  TabOptions,
  TabMeasure,
  InstrumentConfig,
  TabTheme,
  LayoutMetrics,
  ExportOptions,
} from './types.js'
import {
  resolveInstrument,
  DEFAULT_LAYOUT as defaultLayout,
} from './types.js'
import { resolveTheme } from './themes/index.js'
import { reflowMeasures } from './layout/reflow.js'
import { renderStrings, renderTuning } from './svg/strings.js'
import { renderNotes } from './svg/notes.js'
import { renderBarlines } from './svg/barlines.js'
import { renderTimeSignature } from './svg/time-sig.js'
import { renderCursor } from './svg/cursor.js'
import { renderDecoration } from './svg/decorations.js'
import { generateAriaTitle, generateAriaDescription, wrapWithA11y } from './accessibility.js'
import { flattenBeat, durationToBeats } from './utils.js'
import { esc } from './utils.js'

// ---------------------------------------------------------------------------
// Internal: render a single tab line (row of measures)
// ---------------------------------------------------------------------------

function renderLine(
  measures: TabMeasure[],
  startMeasureIdx: number,
  totalMeasures: number,
  instrument: InstrumentConfig,
  theme: TabTheme,
  layout: LayoutMetrics,
  lineWidth: number,
  offsetY: number,
  leftHanded: boolean,
  showTuning: boolean,
  showTimeSignature: boolean,
  noteLabels: boolean,
): string {
  const parts: string[] = []

  // Strings
  parts.push(renderStrings(instrument, theme, layout, lineWidth, offsetY))

  // Tuning labels
  if (showTuning) {
    parts.push(renderTuning(instrument, theme, layout, offsetY, leftHanded))
  }

  const contentStartX = layout.marginLeft + (showTuning ? layout.tuningWidth : 0)
  let x = contentStartX

  const isFirstLine = startMeasureIdx === 0

  // Opening barline
  parts.push(
    renderBarlines(
      x,
      instrument,
      theme,
      layout,
      offsetY,
      measures[0]?.repeat,
      isFirstLine,
      false,
    ),
  )
  x += layout.barlinePadding

  // Time signature on first measure if present
  if (showTimeSignature && measures[0]?.timeSignature) {
    parts.push(
      renderTimeSignature(
        measures[0].timeSignature,
        x + 8,
        instrument,
        theme,
        layout,
        offsetY,
      ),
    )
    x += 24
  }

  // Render each measure
  for (let mi = 0; mi < measures.length; mi++) {
    const measure = measures[mi]
    const globalMeasureIdx = startMeasureIdx + mi

    // Label above
    if (measure.label) {
      const labelY = offsetY + layout.marginTop - 14
      parts.push(
        `<text x="${x}" y="${labelY}" fill="${theme.textColor}" ` +
          `font-family="${theme.fontFamily}" font-size="11" font-weight="600">${esc(measure.label)}</text>`,
      )
    }

    // Notes
    const { svg: notesSvg, width: notesWidth } = renderNotes(
      measure.beats,
      instrument,
      theme,
      layout,
      x,
      offsetY,
      leftHanded,
      globalMeasureIdx,
      noteLabels,
    )
    parts.push(notesSvg)

    // Decorations
    const beats = measure.beats
    let bx = x
    for (let bi = 0; bi < beats.length; bi++) {
      const notes = flattenBeat(beats[bi])
      const beatDurations = notes.map((n) => durationToBeats(n.duration))
      const beatDur = beatDurations.length > 0 ? Math.max(...beatDurations) : 1
      const beatW = beatDur * layout.beatWidth
      const cx = bx + beatW / 2

      const nextNotes =
        bi < beats.length - 1 ? flattenBeat(beats[bi + 1]) : undefined
      const nextBeatDurations = nextNotes?.map((n) => durationToBeats(n.duration))
      const nextBeatDur = nextBeatDurations && nextBeatDurations.length > 0
        ? Math.max(...nextBeatDurations)
        : undefined
      const nextCx = nextBeatDur !== undefined ? bx + beatW + (nextBeatDur * layout.beatWidth) / 2 : undefined

      for (const note of notes) {
        const matchingNext = nextNotes?.find((n) => n.string === note.string)
        parts.push(
          renderDecoration({
            note,
            nextNote: matchingNext,
            cx,
            nextCx,
            instrument,
            theme,
            layout,
            offsetY,
            leftHanded,
          }),
        )
      }

      bx += beatW
    }

    x += notesWidth

    // Barline after measure
    x += layout.barlinePadding
    const isLast =
      globalMeasureIdx === totalMeasures - 1
    const nextMeasure = mi < measures.length - 1 ? measures[mi + 1] : undefined
    parts.push(
      renderBarlines(
        x,
        instrument,
        theme,
        layout,
        offsetY,
        measure.repeat?.end ? measure.repeat : nextMeasure?.repeat,
        false,
        isLast,
      ),
    )
    x += layout.barlinePadding
  }

  // Cursor placeholder
  parts.push(renderCursor(instrument, theme, layout, offsetY))

  return parts.join('')
}

// ---------------------------------------------------------------------------
// Public: static SVG generation
// ---------------------------------------------------------------------------

function generateSvg(options: TabOptions): string {
  const instrument = resolveInstrument(options.instrument)
  const theme = resolveTheme(options.theme)
  const layout = { ...defaultLayout }
  const width = options.width ?? 800
  const leftHanded = options.leftHanded ?? false
  const showTuning = options.showTuning ?? true
  const showTimeSig = options.showTimeSignature ?? true
  const showNoteLabels = options.noteLabels ?? false
  const isResponsive = (options.layout ?? 'responsive') === 'responsive'

  const measures = options.measures

  if (measures.length === 0) {
    return wrapWithA11y('', 'Empty tablature', 'No measures to display', width, 60, theme.background, theme.accentColor)
  }

  const { lines, totalHeight } = isResponsive
    ? reflowMeasures(measures, instrument, layout, width, showTuning)
    : {
        lines: [{ measures, startMeasureIndex: 0 }],
        totalHeight:
          layout.marginTop +
          (instrument.strings - 1) * layout.stringSpacing +
          layout.marginBottom,
      }

  const stringHeight = (instrument.strings - 1) * layout.stringSpacing
  const lineHeight = layout.marginTop + stringHeight + layout.marginBottom
  const svgHeight = totalHeight

  let content = ''
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]
    const offsetY = li * (lineHeight + layout.lineGap)
    const lineWidth = width - layout.marginLeft - layout.marginRight

    content += renderLine(
      line.measures,
      line.startMeasureIndex,
      measures.length,
      instrument,
      theme,
      layout,
      lineWidth,
      offsetY,
      leftHanded,
      showTuning,
      showTimeSig,
      showNoteLabels,
    )
  }

  const title = generateAriaTitle(options, instrument)
  const desc = generateAriaDescription(options, instrument)

  return wrapWithA11y(content, title, desc, width, svgHeight, theme.background, theme.accentColor)
}

// ---------------------------------------------------------------------------
// Public: toSVGDataURL
// ---------------------------------------------------------------------------

function toSVGDataURL(options: TabOptions): string {
  const svg = generateSvg(options)
  const encoded = universalBtoa(svg)
  return `data:image/svg+xml;base64,${encoded}`
}

function universalBtoa(str: string): string {
  if (typeof btoa === 'function') {
    return btoa(unescape(encodeURIComponent(str)))
  }
  // Node.js < 16 fallback via Buffer (runtime check, no @types/node needed)
  const g = globalThis as Record<string, unknown>
  if (typeof g.Buffer === 'function') {
    const B = g.Buffer as unknown as { from(s: string, e: string): { toString(e: string): string } }
    return B.from(str, 'utf-8').toString('base64')
  }
  // Last resort: manual base64 via TextEncoder
  const bytes = new TextEncoder().encode(str)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]
    const b1 = bytes[i + 1] ?? 0
    const b2 = bytes[i + 2] ?? 0
    result += chars[b0 >> 2]
    result += chars[((b0 & 3) << 4) | (b1 >> 4)]
    result += i + 1 < bytes.length ? chars[((b1 & 15) << 2) | (b2 >> 6)] : '='
    result += i + 2 < bytes.length ? chars[b2 & 63] : '='
  }
  return result
}

// ---------------------------------------------------------------------------
// Public: toPNG (browser only)
// ---------------------------------------------------------------------------

async function toPNG(
  options: TabOptions,
  exportOpts?: ExportOptions,
): Promise<Blob> {
  const scale = exportOpts?.scale ?? 2
  const svg = generateSvg(options)

  const parser = new DOMParser()
  const doc = parser.parseFromString(svg, 'image/svg+xml')
  const svgEl = doc.documentElement
  const w = Number(svgEl.getAttribute('width')) * scale
  const h = Number(svgEl.getAttribute('height')) * scale

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('tabkit: Canvas 2D context not available')
  ctx.scale(scale, scale)

  const img = new Image()
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)

  return new Promise((resolve, reject) => {
    img.onload = () => {
      ctx.drawImage(img, 0, 0)
      URL.revokeObjectURL(url)
      canvas.toBlob((b) => {
        if (b) resolve(b)
        else reject(new Error('Failed to create PNG blob'))
      }, 'image/png')
    }
    img.onerror = reject
    img.src = url
  })
}

// ---------------------------------------------------------------------------
// Public: download (browser only)
// ---------------------------------------------------------------------------

async function download(
  options: TabOptions,
  exportOpts?: ExportOptions,
): Promise<void> {
  const format = exportOpts?.format ?? 'svg'
  const filename = exportOpts?.filename ?? 'tablature'

  let blobUrl: string
  if (format === 'png') {
    const blob = await toPNG(options, exportOpts)
    blobUrl = URL.createObjectURL(blob)
  } else {
    const svg = generateSvg(options)
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    blobUrl = URL.createObjectURL(blob)
  }

  const a = document.createElement('a')
  a.href = blobUrl
  a.download = `${filename}.${format}`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(blobUrl)
}

// ---------------------------------------------------------------------------
// Builder class (browser)
// ---------------------------------------------------------------------------

export class TabRenderer {
  // Static API
  static svg = generateSvg
  static toSVGDataURL = toSVGDataURL
  static toPNG = toPNG
  static download = download

  // Builder instance state
  private _el: HTMLElement | null = null
  private _options: Partial<TabOptions> = {}

  constructor(selector?: string | HTMLElement) {
    if (typeof selector === 'string' && typeof document !== 'undefined') {
      this._el = document.querySelector(selector)
    } else if (selector instanceof HTMLElement) {
      this._el = selector
    }
  }

  measures(m: TabOptions['measures']): this {
    this._options.measures = m
    return this
  }

  instrument(i: TabOptions['instrument']): this {
    this._options.instrument = i
    return this
  }

  theme(t: TabOptions['theme']): this {
    this._options.theme = t
    return this
  }

  leftHanded(v = true): this {
    this._options.leftHanded = v
    return this
  }

  layout(l: TabOptions['layout']): this {
    this._options.layout = l
    return this
  }

  width(w: number): this {
    this._options.width = w
    return this
  }

  showTuning(v = true): this {
    this._options.showTuning = v
    return this
  }

  showTimeSignature(v = true): this {
    this._options.showTimeSignature = v
    return this
  }

  noteLabels(v = true): this {
    this._options.noteLabels = v
    return this
  }

  draw(): this {
    if (!this._el) throw new Error('TabRenderer: no target element')
    if (!this._options.measures) throw new Error('TabRenderer: no measures provided')

    const svg = generateSvg(this._options as TabOptions)
    this._el.innerHTML = svg
    return this
  }

  /** Get the underlying SVG string without rendering to DOM */
  toSvg(): string {
    if (!this._options.measures) throw new Error('TabRenderer: no measures provided')
    return generateSvg(this._options as TabOptions)
  }
}
