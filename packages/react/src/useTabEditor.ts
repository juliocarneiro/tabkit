import { useRef, useEffect, useState, useCallback } from 'react'
import { TabRenderer } from '@tabkit/core'
import type { TabMeasure } from '@tabkit/core'
import type { UseTabEditorOptions, UseTabEditorReturn } from './types.js'

interface History {
  past: TabMeasure[][]
  present: TabMeasure[]
  future: TabMeasure[][]
}

function createEmpty(count: number): TabMeasure[] {
  return Array.from({ length: count }, (): TabMeasure => ({
    beats: [],
    timeSignature: [4, 4],
  }))
}

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

  const ref = useRef<HTMLDivElement>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [state, setState] = useState<History>(() => ({
    past: [],
    present: createEmpty(initialMeasures),
    future: [],
  }))

  // Transitions are computed from this ref (never inside a setState updater),
  // so they run exactly once even under React StrictMode.
  const stateRef = useRef(state)

  const commit = useCallback((next: History) => {
    stateRef.current = next
    setState(next)
    onChangeRef.current?.(next.present)
  }, [])

  const setMeasures = useCallback(
    (newMeasures: TabMeasure[]) => {
      const s = stateRef.current
      commit({ past: [...s.past, s.present], present: newMeasures, future: [] })
    },
    [commit],
  )

  const clear = useCallback(() => {
    setMeasures(createEmpty(initialMeasures))
  }, [initialMeasures, setMeasures])

  const undo = useCallback(() => {
    const s = stateRef.current
    if (s.past.length === 0) return
    commit({
      past: s.past.slice(0, -1),
      present: s.past[s.past.length - 1],
      future: [...s.future, s.present],
    })
  }, [commit])

  const redo = useCallback(() => {
    const s = stateRef.current
    if (s.future.length === 0) return
    commit({
      past: [...s.past, s.present],
      present: s.future[s.future.length - 1],
      future: s.future.slice(0, -1),
    })
  }, [commit])

  const measures = state.present

  // Render SVG
  useEffect(() => {
    const el = ref.current
    if (!el) return

    el.innerHTML = TabRenderer.svg({
      measures,
      instrument: instrumentProp,
      theme,
      width,
      layout: 'responsive',
    })
  }, [measures, instrumentProp, theme, width])

  return {
    ref,
    measures,
    setMeasures,
    clear,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  }
}
