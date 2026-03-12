import { useRef, useEffect, useState, useCallback } from 'react'
import { TabRenderer, resolveInstrument, DEFAULT_LAYOUT } from '@tabkit/core'
import type { TabMeasure, TabNote, Duration } from '@tabkit/core'
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

    const svgString = TabRenderer.svg({
      measures,
      instrument: instrumentProp,
      theme,
      width,
      layout: 'responsive',
    })
    el.innerHTML = svgString
  }, [measures, instrumentProp, theme, width, isClient])

  const handleSvgClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isClient) return
      const el = containerRef.current
      if (!el) return

      const svg = el.querySelector('svg')
      if (!svg) return

      const rect = svg.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top

      const stringIdx = Math.round(
        (clickY - DEFAULT_LAYOUT.marginTop) / DEFAULT_LAYOUT.stringSpacing,
      )
      if (stringIdx < 0 || stringIdx >= instrument.strings) return
      const stringNum = stringIdx + 1

      const showTuning = true
      const contentStartX =
        DEFAULT_LAYOUT.marginLeft +
        (showTuning ? DEFAULT_LAYOUT.tuningWidth : 0) +
        DEFAULT_LAYOUT.barlinePadding

      let measureIdx = 0
      if (measures.length > 1) {
        const totalContentWidth = width - contentStartX - DEFAULT_LAYOUT.marginRight
        const mw = totalContentWidth / measures.length
        measureIdx = Math.min(
          Math.floor((clickX - contentStartX) / mw),
          measures.length - 1,
        )
        measureIdx = Math.max(0, measureIdx)
      }

      setOverlay({
        visible: true,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        stringNum,
        measureIdx,
      })

      setTimeout(() => inputRef.current?.focus(), 0)
    },
    [isClient, instrument, measures, width],
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
        duration: '8n' as Duration,
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
            zIndex: 10,
          }}
        />
      )}
    </div>
  )
}
