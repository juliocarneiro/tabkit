import { useRef, useEffect, useMemo } from 'react'
import { TabRenderer } from '@tabkit/core'
import type { TabSheetProps } from './types.js'
import { noteFromEvent } from './noteClick.js'

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
  const onNoteClickRef = useRef(onNoteClick)
  const measuresRef = useRef(tabOptions.measures)
  onNoteClickRef.current = onNoteClick
  measuresRef.current = tabOptions.measures

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
      tabOptions.id,
      tabOptions.ariaTitle,
      tabOptions.ariaDescription,
    ],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.innerHTML = svgString
  }, [svgString])

  const clickable = !!onNoteClick
  useEffect(() => {
    if (!clickable) return
    const el = containerRef.current
    if (!el) return

    const handler = (e: MouseEvent) => {
      const hit = noteFromEvent(e, measuresRef.current)
      if (hit) onNoteClickRef.current?.(hit.note, hit.measure, hit.beat)
    }

    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [clickable])

  return <div ref={containerRef} className={className} style={style} />
}
