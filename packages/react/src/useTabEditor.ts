import { useRef, useEffect, useState, useCallback } from 'react'
import { TabRenderer, resolveInstrument } from '@tabkit/core'
import type { TabMeasure } from '@tabkit/core'
import type { UseTabEditorOptions, UseTabEditorReturn } from './types.js'

/**
 * Hook for full control over a tab editor instance.
 * Provides undo/redo, clear, and reactive measure state.
 */
export function useTabEditor(options: UseTabEditorOptions): UseTabEditorReturn {
  const {
    instrument: instrumentProp,
    theme,
    initialMeasures = 4,
    width = 800,
    onChange,
  } = options

  const instrument = resolveInstrument(instrumentProp)
  const ref = useRef<HTMLDivElement>(null)

  const createEmpty = useCallback(
    () =>
      Array.from({ length: initialMeasures }, (): TabMeasure => ({
        beats: [],
        timeSignature: [4, 4],
      })),
    [initialMeasures],
  )

  const [measures, setMeasuresState] = useState<TabMeasure[]>(createEmpty)
  const [history, setHistory] = useState<TabMeasure[][]>([])
  const [future, setFuture] = useState<TabMeasure[][]>([])

  const setMeasures = useCallback(
    (newMeasures: TabMeasure[]) => {
      setHistory((prev) => [...prev, measures])
      setFuture([])
      setMeasuresState(newMeasures)
      onChange?.(newMeasures)
    },
    [measures, onChange],
  )

  const clear = useCallback(() => {
    setMeasures(createEmpty())
  }, [createEmpty, setMeasures])

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      const rest = prev.slice(0, -1)
      setFuture((f) => [...f, measures])
      setMeasuresState(last)
      onChange?.(last)
      return rest
    })
  }, [measures, onChange])

  const redo = useCallback(() => {
    setFuture((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      const rest = prev.slice(0, -1)
      setHistory((h) => [...h, measures])
      setMeasuresState(last)
      onChange?.(last)
      return rest
    })
  }, [measures, onChange])

  // Render SVG
  useEffect(() => {
    const el = ref.current
    if (!el) return

    const svgString = TabRenderer.svg({
      measures,
      instrument: instrumentProp,
      theme,
      width,
      layout: 'responsive',
    })
    el.innerHTML = svgString
  }, [measures, instrumentProp, theme, width])

  return {
    ref,
    measures,
    setMeasures,
    clear,
    undo,
    redo,
  }
}
