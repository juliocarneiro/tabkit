import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { TabRenderer } from 'tabkit'
import { TabPlayer } from '@tabkit/player'
import type { UseTabPlayerOptions, UseTabPlayerReturn } from './types.js'

/**
 * Hook for full control over a TabPlayer instance.
 * Returns a ref to attach to a container div, transport controls,
 * and reactive state.
 */
export function useTabPlayer(options: UseTabPlayerOptions): UseTabPlayerReturn {
  const {
    measures,
    instrument,
    theme,
    tempo = 120,
    loop = false,
    width,
    leftHanded,
    onBeat,
    onNote,
    onEnd,
  } = options

  const ref = useRef<HTMLDivElement>(null)
  const playerRef = useRef<TabPlayer | null>(null)
  const onBeatRef = useRef(onBeat)
  const onNoteRef = useRef(onNote)
  const onEndRef = useRef(onEnd)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentMeasure, setCurrentMeasure] = useState(0)
  const [currentBeat, setCurrentBeat] = useState(0)

  onBeatRef.current = onBeat
  onNoteRef.current = onNote
  onEndRef.current = onEnd

  const svgString = useMemo(
    () =>
      TabRenderer.svg({
        measures,
        instrument,
        theme,
        width,
        leftHanded,
        layout: 'responsive',
      }),
    [measures, instrument, theme, width, leftHanded],
  )

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.innerHTML = svgString

    const svg = el.querySelector('svg') as SVGSVGElement | null

    const player = new TabPlayer(measures, {
      tempo,
      loop,
      onBeat: (m: number, b: number) => {
        setCurrentMeasure(m)
        setCurrentBeat(b)
        onBeatRef.current?.(m, b)
      },
      onNote: (notes: import('tabkit').TabNote[], m: number, b: number, t: number) => {
        onNoteRef.current?.(notes, m, b, t)
      },
      onEnd: () => {
        setIsPlaying(false)
        setCurrentMeasure(0)
        setCurrentBeat(0)
        onEndRef.current?.()
      },
    })

    if (svg) player.attachSvg(svg)
    playerRef.current = player

    return () => {
      player.destroy()
      playerRef.current = null
    }
  }, [svgString, tempo, loop])

  const play = useCallback(() => {
    playerRef.current?.play()
    setIsPlaying(true)
  }, [])

  const pause = useCallback(() => {
    playerRef.current?.pause()
    setIsPlaying(false)
  }, [])

  const stop = useCallback(() => {
    playerRef.current?.stop()
    setIsPlaying(false)
    setCurrentMeasure(0)
    setCurrentBeat(0)
  }, [])

  const seek = useCallback((m: number, b: number) => {
    playerRef.current?.seek(m, b)
    setCurrentMeasure(m)
    setCurrentBeat(b)
  }, [])

  const setTempo = useCallback((bpm: number) => {
    playerRef.current?.setTempo(bpm)
  }, [])

  return {
    ref,
    play,
    pause,
    stop,
    seek,
    isPlaying,
    currentMeasure,
    currentBeat,
    setTempo,
  }
}
