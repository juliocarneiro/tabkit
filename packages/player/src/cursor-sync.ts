import type { CursorPosition } from './types.js'

/**
 * Manages the visual cursor (playback line) and note highlighting
 * inside a rendered tabkit SVG.
 *
 * Uses element.style for all DOM mutations so CSS transitions fire
 * reliably (setAttribute on SVG presentation attributes does NOT
 * trigger CSS transitions in all browsers).
 */
export class CursorSync {
  private _svgRoot: SVGSVGElement | null = null
  private _cursors: SVGLineElement[] = []
  private _accentColor = ''

  attach(svg: SVGSVGElement): void {
    this._svgRoot = svg
    this._cursors = Array.from(svg.querySelectorAll<SVGLineElement>('.tk-cursor'))
    this._accentColor =
      getComputedStyle(svg).getPropertyValue('--tk-accent').trim() || '#3b82f6'
  }

  detach(): void {
    this.hide()
    this._clearHighlights()
    this._svgRoot = null
    this._cursors = []
  }

  /**
   * Move the cursor line to a specific x-position on a specific tab line.
   * Uses element.style so CSS transitions fire properly.
   */
  moveTo(position: CursorPosition): void {
    for (let i = 0; i < this._cursors.length; i++) {
      const cursor = this._cursors[i]
      if (i === position.lineIndex) {
        cursor.style.opacity = '1'
        cursor.style.transform = `translateX(${position.x}px)`
      } else {
        cursor.style.opacity = '0'
      }
    }
  }

  hide(): void {
    for (const cursor of this._cursors) {
      cursor.style.opacity = '0'
    }
  }

  /**
   * Highlight notes at the given measure/beat and move cursor to their x position.
   * Returns the x position of the highlighted notes (or -1 if none found).
   */
  highlightBeat(measureIndex: number, beatIndex: number): number {
    if (!this._svgRoot) return -1

    this._clearHighlights()

    const selector = `text[data-measure="${measureIndex}"][data-beat="${beatIndex}"]`
    const notes = this._svgRoot.querySelectorAll<SVGTextElement>(selector)

    if (notes.length === 0) return -1

    let sumX = 0
    for (const note of notes) {
      note.classList.add('tk-note-active')
      note.style.fill = this._accentColor
      note.style.fontSize = '14px'
      sumX += parseFloat(note.getAttribute('x') ?? '0')
    }

    const avgX = sumX / notes.length

    const noteY = parseFloat(notes[0].getAttribute('y') ?? '0')
    let lineIndex = 0
    for (let i = 0; i < this._cursors.length; i++) {
      const cursorY1 = parseFloat(this._cursors[i].getAttribute('y1') ?? '0')
      const cursorY2 = parseFloat(this._cursors[i].getAttribute('y2') ?? '99999')
      if (noteY >= cursorY1 && noteY <= cursorY2) {
        lineIndex = i
        break
      }
    }

    this.moveTo({ lineIndex, x: avgX, measureIndex, beatIndex })
    return avgX
  }

  private _clearHighlights(): void {
    if (!this._svgRoot) return
    const prev = this._svgRoot.querySelectorAll<SVGElement>('.tk-note-active')
    for (const el of prev) {
      el.classList.remove('tk-note-active')
      el.style.fill = ''
      el.style.fontSize = ''
    }
  }
}
