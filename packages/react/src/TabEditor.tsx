import { useRef, useEffect, useState, useCallback } from 'react'
import { TabRenderer, resolveInstrument, computeTabLayout } from '@tabkit/core'
import type { TabMeasure, TabNote, TabOptions } from '@tabkit/core'
import type { TabEditorProps } from './types.js'

function createEmptyMeasures(count: number): TabMeasure[] {
  return Array.from({ length: count }, () => ({
    beats: [],
    timeSignature: [4, 4] as [number, number],
  }))
}

interface EditOverlay {
  visible: boolean
  x: number
  y: number
  stringNum: number
  measureIdx: number
}

/**
 * TabEditor is an interactive tab editor.
 * Click on a string position to open an inline fret input.
 * Browser-only — renders an empty div during SSR.
 */
export function TabEditor(props: TabEditorProps) {
  const {
    instrument: instrumentProp,
    theme,
    measures: measureCount = 4,
    width = 800,
    className,
    style,
    onChange,
  } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const instrument = resolveInstrument(instrumentProp)
  const [measures, setMeasures] = useState<TabMeasure[]>(() =>
    createEmptyMeasures(measureCount),
  )
  const [isClient, setIsClient] = useState(false)
  const [overlay, setOverlay] = useState<EditOverlay>({
    visible: false,
    x: 0,
    y: 0,
    stringNum: 1,
    measureIdx: 0,
  })

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    const el = containerRef.current
    if (!el) return

    el.innerHTML = TabRenderer.svg({
      measures,
      instrument: instrumentProp,
      theme,
      width,
      layout: 'responsive',
    })
  }, [measures, instrumentProp, theme, width, isClient])

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = containerRef.current
      const svg = el?.querySelector('svg')
      if (!el || !svg) return

      // Hit-test against the renderer's own layout, in SVG units
      const options: TabOptions = {
        measures,
        instrument: instrumentProp,
        width,
        layout: 'responsive',
      }
      const tabLayout = computeTabLayout(options)
      const rect = svg.getBoundingClientRect()
      const scaleX = rect.width > 0 ? tabLayout.width / rect.width : 1
      const scaleY = rect.height > 0 ? tabLayout.height / rect.height : 1
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY

      const tolerance = tabLayout.stringSpacing / 2
      const line = tabLayout.lines.find(
        (l) => y >= l.top - tolerance && y <= l.bottom + tolerance,
      )
      if (!line || line.measures.length === 0) return

      const stringIdx = Math.round((y - line.top) / tabLayout.stringSpacing)
      if (stringIdx < 0 || stringIdx >= instrument.strings) return

      const first = line.measures[0]
      const last = line.measures[line.measures.length - 1]
      if (x < first.x || x > last.x + last.width) return
      const box =
        line.measures.find((b) => x >= b.x && x < b.x + b.width) ?? last

      const containerRect = el.getBoundingClientRect()
      setOverlay({
        visible: true,
        x: e.clientX - containerRect.left,
        y: e.clientY - containerRect.top,
        stringNum: stringIdx + 1,
        measureIdx: box.index,
      })

      setTimeout(() => inputRef.current?.focus(), 0)
    },
    [instrument.strings, instrumentProp, measures, width],
  )

  const commitFret = useCallback(
    (value: string) => {
      const fretNum = parseInt(value, 10)
      if (isNaN(fretNum) || fretNum < 0 || fretNum > instrument.frets) {
        setOverlay((o) => ({ ...o, visible: false }))
        return
      }

      const newNote: TabNote = {
        string: overlay.stringNum,
        fret: fretNum,
        duration: '8n',
      }

      const updated = [...measures]
      updated[overlay.measureIdx] = {
        ...updated[overlay.measureIdx],
        beats: [...updated[overlay.measureIdx].beats, newNote],
      }

      setMeasures(updated)
      onChange?.(updated)
      setOverlay((o) => ({ ...o, visible: false }))
    },
    [measures, overlay, instrument.frets, onChange],
  )

  const handleInputKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        commitFret(e.currentTarget.value)
      } else if (e.key === 'Escape') {
        setOverlay((o) => ({ ...o, visible: false }))
      }
    },
    [commitFret],
  )

  const handleInputBlur = useCallback(() => {
    setOverlay((o) => ({ ...o, visible: false }))
  }, [])

  if (!isClient) {
    return <div className={className} style={style} />
  }

  return (
    <div className={className} style={{ position: 'relative', ...style }}>
      <div ref={containerRef} onClick={handleSvgClick} style={{ cursor: 'crosshair' }} />
      {overlay.visible && (
        <input
          ref={inputRef}
          type="number"
          min={0}
          max={instrument.frets}
          placeholder="fret"
          aria-label={`Fret for string ${overlay.stringNum}, measure ${overlay.measureIdx + 1}`}
          onKeyDown={handleInputKeyDown}
          onBlur={handleInputBlur}
          style={{
            position: 'absolute',
            left: overlay.x - 20,
            top: overlay.y - 12,
            width: 40,
            height: 24,
            fontSize: 12,
            textAlign: 'center',
            border: '2px solid #3b82f6',
            borderRadius: 4,
            outline: 'none',
            background: '#fff',
            color: '#111',
            zIndex: 10,
          }}
        />
      )}
    </div>
  )
}
