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
import { computeTabLayout } from './layout/compute.js'
import type { LineBox } from './layout/compute.js'
import { renderStrings, renderTuning } from './svg/strings.js'
import { renderNotes } from './svg/notes.js'
import { renderBarlines } from './svg/barlines.js'
import { renderTimeSignature } from './svg/time-sig.js'
import { renderCursor } from './svg/cursor.js'
import { renderDecoration } from './svg/decorations.js'
import { generateAriaTitle, generateAriaDescription, wrapWithA11y } from './accessibility.js'
import { flattenBeat, beatPixelWidth, esc } from './utils.js'

// ---------------------------------------------------------------------------
// Internal: render a single tab line (row of measures)
// ---------------------------------------------------------------------------

interface LineContext {
  measures: TabMeasure[]
  instrument: InstrumentConfig
  theme: TabTheme
  layout: LayoutMetrics
  stringsStartX: number
  stringsEndX: number
  leftHanded: boolean
  showTuning: boolean
  noteLabels: boolean
}

function renderLine(line: LineBox, ctx: LineContext): string {
  const { measures, instrument, theme, layout, leftHanded } = ctx
  const offsetY = line.offsetY
  const parts: string[] = []

  parts.push(
    renderStrings(instrument, theme, layout, ctx.stringsStartX, ctx.stringsEndX, offsetY),
  )

  if (ctx.showTuning) {
    parts.push(renderTuning(instrument, theme, layout, offsetY, leftHanded))
  }

  const first = line.measures[0]
  if (!first) return parts.join('')

  // Opening barline of the line
  parts.push(
    renderBarlines(first.x, instrument, theme, layout, offsetY, {
      repeatStart: !!measures[first.index].repeat?.start,
      isFirst: first.index === 0,
    }),
  )

  for (let mi = 0; mi < line.measures.length; mi++) {
    const box = line.measures[mi]
    const measure = measures[box.index]
    const nextBox = line.measures[mi + 1]

    if (box.timeSignature && measure.timeSignature) {
      parts.push(
        renderTimeSignature(
          measure.timeSignature,
          box.x + layout.barlinePadding + 12,
          instrument,
          theme,
          layout,
          offsetY,
        ),
      )
    }

    if (measure.label) {
      const labelY = offsetY + layout.marginTop - 14
      parts.push(
        `<text x="${box.contentX}" y="${labelY}" fill="${theme.textColor}" ` +
          `font-family="${theme.fontFamily}" font-size="11" font-weight="600">${esc(measure.label)}</text>`,
      )
    }

    parts.push(
      renderNotes(
        measure.beats,
        instrument,
        theme,
        layout,
        box.contentX,
        offsetY,
        leftHanded,
        box.index,
        ctx.noteLabels,
      ).svg,
    )

    // Technique decorations
    const beats = measure.beats
    let bx = box.contentX
    for (let bi = 0; bi < beats.length; bi++) {
      const notes = flattenBeat(beats[bi])
      const beatW = beatPixelWidth(beats[bi], layout)
      const cx = bx + beatW / 2

      const nextBeat = bi < beats.length - 1 ? beats[bi + 1] : undefined
      const nextNotes = nextBeat ? flattenBeat(nextBeat) : undefined
      const nextCx = nextBeat
        ? bx + beatW + beatPixelWidth(nextBeat, layout) / 2
        : undefined

      for (const note of notes) {
        parts.push(
          renderDecoration({
            note,
            nextNote: nextNotes?.find((n) => n.string === note.string),
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

    // Closing barline of this measure (shared with the next one on the line)
    parts.push(
      renderBarlines(box.x + box.width, instrument, theme, layout, offsetY, {
        repeatEnd: !!measure.repeat?.end,
        times: measure.repeat?.times,
        repeatStart: nextBox ? !!measures[nextBox.index].repeat?.start : false,
        isLast: box.index === measures.length - 1,
      }),
    )
  }

  // Cursor placeholder
  parts.push(renderCursor(instrument, theme, layout, offsetY))

  return parts.join('')
}

/** Escape every theme value so user-supplied themes can't break out of attributes */
function sanitizeTheme(theme: TabTheme): TabTheme {
  const out = {} as Record<string, string>
  for (const key of Object.keys(theme)) {
    out[key] = esc(String((theme as unknown as Record<string, unknown>)[key]))
  }
  return out as unknown as TabTheme
}

// ---------------------------------------------------------------------------
// Public: static SVG generation
// ---------------------------------------------------------------------------

function generateSvg(options: TabOptions): string {
  const instrument = resolveInstrument(options.instrument)
  const theme = sanitizeTheme(resolveTheme(options.theme))
  const layout = { ...defaultLayout }
  const measures = options.measures ?? []

  const tabLayout = computeTabLayout({ ...options, measures }, layout)
  const width = tabLayout.width

  if (measures.length === 0) {
    return wrapWithA11y(
      '',
      options.ariaTitle ?? 'Empty tablature',
      options.ariaDescription ?? 'No measures to display',
      width,
      60,
      theme.background,
      theme.accentColor,
      options.id,
    )
  }

  const ctx: LineContext = {
    measures,
    instrument,
    theme,
    layout,
    stringsStartX: tabLayout.contentStartX,
    stringsEndX: width - layout.marginRight,
    leftHanded: options.leftHanded ?? false,
    showTuning: options.showTuning ?? true,
    noteLabels: options.noteLabels ?? false,
  }

  let content = ''
  for (const line of tabLayout.lines) content += renderLine(line, ctx)

  const title = generateAriaTitle(options, instrument)
  const desc = generateAriaDescription(options, instrument)

  return wrapWithA11y(
    content,
    title,
    desc,
    width,
    tabLayout.height,
    theme.background,
    theme.accentColor,
    options.id,
  )
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
        else reject(new Error('tabkit: failed to create PNG blob'))
      }, 'image/png')
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('tabkit: failed to rasterize SVG'))
    }
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
  // Give the browser a tick to start the download before releasing the blob
  setTimeout(() => URL.revokeObjectURL(blobUrl), 0)
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
    if (typeof selector === 'string') {
      if (typeof document !== 'undefined') this._el = document.querySelector(selector)
    } else if (selector && typeof selector === 'object') {
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
