import { useRef, useEffect, useMemo } from 'react'
import { TabRenderer, flattenBeat } from '@tabkit/core'
import type { TabSheetProps } from './types.js'

/**
 * TabSheet renders a static tablature SVG.
 * Accepts all TabOptions plus className and style.
 */
export function TabSheet(props: TabSheetProps) {
  const {
    className,
    style,
    onNoteClick,
    ...tabOptions
  } = props

  const containerRef = useRef<HTMLDivElement>(null)

  const svgString = useMemo(
    () => TabRenderer.svg(tabOptions),
    [
      tabOptions.measures,
      tabOptions.instrument,
      tabOptions.theme,
      tabOptions.layout,
      tabOptions.leftHanded,
      tabOptions.width,
      tabOptions.showTuning,
      tabOptions.showTimeSignature,
      tabOptions.noteLabels,
      tabOptions.ariaTitle,
      tabOptions.ariaDescription,
    ],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.innerHTML = svgString
  }, [svgString])

  useEffect(() => {
    if (!onNoteClick) return
    const el = containerRef.current
    if (!el) return

    const handler = (e: MouseEvent) => {
      const target = e.target as SVGElement
      if (target.tagName !== 'text') return

      const measure = target.getAttribute('data-measure')
      const beat = target.getAttribute('data-beat')
      const string = target.getAttribute('data-string')
      const fret = target.getAttribute('data-fret')

      if (measure !== null && beat !== null && string !== null && fret !== null) {
        const mi = Number(measure)
        const bi = Number(beat)
        const si = Number(string)
        const fi = Number(fret)

        const m = tabOptions.measures[mi]
        const beatData = m?.beats[bi]
        const notes = beatData ? flattenBeat(beatData) : []
        const matched = notes.find((n) => n.string === si && n.fret === fi)

        onNoteClick(
          matched ?? { string: si, fret: fi, duration: '4n' },
          mi,
          bi,
        )
      }
    }

    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [onNoteClick, tabOptions.measures])

  return <div ref={containerRef} className={className} style={style} />
}
