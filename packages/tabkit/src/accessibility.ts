import type { TabMeasure, TabOptions, InstrumentConfig } from './types.js'
import { flattenBeat } from './utils.js'
import { esc } from './utils.js'

/**
 * Generate an accessible title for the tablature SVG.
 */
export function generateAriaTitle(
  options: TabOptions,
  instrument: InstrumentConfig,
): string {
  if (options.ariaTitle) return options.ariaTitle
  const name = instrument.name ?? 'stringed instrument'
  const count = options.measures.length
  return `Tablature for ${name}, ${count} measure${count !== 1 ? 's' : ''}`
}

/**
 * Generate a detailed text description of the tablature for screen readers.
 * Describes each measure and its notes.
 */
export function generateAriaDescription(
  options: TabOptions,
  instrument: InstrumentConfig,
): string {
  if (options.ariaDescription) return options.ariaDescription

  const parts: string[] = []
  const name = instrument.name ?? 'instrument'
  parts.push(`${instrument.strings}-string ${name} tablature.`)

  for (let mi = 0; mi < options.measures.length; mi++) {
    const m = options.measures[mi]
    const noteDescs: string[] = []

    for (const beat of m.beats) {
      const notes = flattenBeat(beat)
      if (notes.length === 1) {
        const n = notes[0]
        noteDescs.push(`string ${n.string} fret ${n.fret}`)
      } else {
        const chord = notes.map((n) => `string ${n.string} fret ${n.fret}`).join(', ')
        noteDescs.push(`chord: ${chord}`)
      }
    }

    const label = m.label ? ` (${m.label})` : ''
    const ts = m.timeSignature ? ` in ${m.timeSignature[0]}/${m.timeSignature[1]}` : ''
    parts.push(`Measure ${mi + 1}${label}${ts}: ${noteDescs.join('; ')}.`)
  }

  return parts.join(' ')
}

let _idCounter = 0

/**
 * Wrap SVG content with accessibility attributes: role, title, desc.
 * Uses auto-incrementing IDs so multiple tablatures on the same page don't conflict.
 */
export function wrapWithA11y(
  svgContent: string,
  title: string,
  description: string,
  width: number,
  height: number,
  background: string,
  accentColor?: string,
): string {
  const uid = ++_idCounter
  const titleId = `tk-title-${uid}`
  const descId = `tk-desc-${uid}`
  const accent = accentColor ? `--tk-accent:${accentColor};` : ''

  const builtInStyles =
    `.tk-note-active{fill:var(--tk-accent,#3b82f6)!important;font-size:14px!important;` +
    `transition:fill 80ms ease,font-size 80ms ease}` +
    `.tk-cursor{transition:transform 80ms linear,opacity 120ms ease}`

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `width="${width}" height="${height}" ` +
    `viewBox="0 0 ${width} ${height}" ` +
    `role="img" aria-labelledby="${titleId} ${descId}" ` +
    `style="background:${background};${accent}">` +
    `<defs><style>${builtInStyles}</style></defs>` +
    `<title id="${titleId}">${esc(title)}</title>` +
    `<desc id="${descId}">${esc(description)}</desc>` +
    svgContent +
    `</svg>`
  )
}
