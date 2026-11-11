import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { TabRenderer } from '@tabkit/core'
import type { TabNote } from '@tabkit/core'
import { TabPlayer } from '@tabkit/player'
import type { UseTabPlayerOptions, UseTabPlayerReturn } from './types.js'

/**
 * Hook for full control over a TabPlayer instance.
 * Returns a ref to attach to a container div, transport controls,
 * and reactive state.
 *
 * Changing `tempo` or `loop` updates the running player in place; changing
 * anything that re-renders the SVG (measures, width, theme…) stops playback.
 */
export function useTabPlayer(options: UseTabPlayerOptions): UseTabPlayerReturn {
  const {
    measures,
    instrument,
    theme,
    tempo = 120,
    loop = false,
    countIn = false,
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
  const tempoRef = useRef(tempo)
  const loopRef = useRef(loop)
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
      tempo: tempoRef.current,
      loop: loopRef.current,
      countIn,
      onBeat: (m: number, b: number) => {
        setCurrentMeasure(m)
        setCurrentBeat(b)
        onBeatRef.current?.(m, b)
      },
      onNote: (notes: TabNote[], m: number, b: number, t: number) => {
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
      // The old player is gone — never leave the UI claiming it still plays
      setIsPlaying(false)
      setCurrentMeasure(0)
      setCurrentBeat(0)
    }
    // `measures` is covered by svgString
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgString, countIn])

  // Tempo and loop are applied to the live player, without restarting it
  useEffect(() => {
    tempoRef.current = tempo
    playerRef.current?.setTempo(tempo)
  }, [tempo])

  useEffect(() => {
    loopRef.current = loop
    playerRef.current?.setLoop(loop)
  }, [loop])

  const play = useCallback(() => {
    const player = playerRef.current
    if (!player) return
    player.play()
    setIsPlaying(player.isPlaying)
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
    tempoRef.current = bpm
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
