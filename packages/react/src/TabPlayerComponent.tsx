import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { TabRenderer } from '@tabkit/core'
import type { TabNote } from '@tabkit/core'
import { TabPlayer as TabPlayerEngine } from '@tabkit/player'
import type { TabPlayerProps } from './types.js'
import { noteFromEvent } from './noteClick.js'

/**
 * TabPlayer renders a tablature with integrated playback controls.
 * Includes play/pause/stop buttons and optional tempo slider.
 */
export function TabPlayer(props: TabPlayerProps) {
  const {
    className,
    style,
    tempo = 120,
    loop = false,
    countIn = false,
    showControls = true,
    onBeat,
    onNote,
    onEnd,
    onNoteClick,
    ...tabOptions
  } = props

  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<TabPlayerEngine | null>(null)
  const onBeatRef = useRef(onBeat)
  const onNoteRef = useRef(onNote)
  const onEndRef = useRef(onEnd)
  const onNoteClickRef = useRef(onNoteClick)
  const measuresRef = useRef(tabOptions.measures)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentMeasure, setCurrentMeasure] = useState(0)
  const [currentBeat, setCurrentBeat] = useState(0)
  const [currentTempo, setCurrentTempo] = useState(tempo)
  const tempoRef = useRef(currentTempo)
  const loopRef = useRef(loop)

  // Keep callback refs up to date without recreating the player
  onBeatRef.current = onBeat
  onNoteRef.current = onNote
  onEndRef.current = onEnd
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

    const svg = el.querySelector('svg') as SVGSVGElement | null

    const player = new TabPlayerEngine(measuresRef.current, {
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
  }, [svgString, countIn])

  // The `tempo` prop stays in control after mount
  useEffect(() => {
    setCurrentTempo(tempo)
  }, [tempo])

  // Tempo and loop are applied to the live player, without restarting it
  useEffect(() => {
    tempoRef.current = currentTempo
    playerRef.current?.setTempo(currentTempo)
  }, [currentTempo])

  useEffect(() => {
    loopRef.current = loop
    playerRef.current?.setLoop(loop)
  }, [loop])

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

  const controlsStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 0',
    fontFamily: 'system-ui, sans-serif',
    fontSize: '13px',
  }

  const btnStyle: React.CSSProperties = {
    padding: '4px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    background: '#fff',
    color: '#111',
    cursor: 'pointer',
    fontSize: '13px',
  }

  return (
    <div className={className} style={style}>
      <div ref={containerRef} />
      {showControls && (
        <div style={controlsStyle}>
          {isPlaying ? (
            <button style={btnStyle} onClick={pause} type="button">
              Pause
            </button>
          ) : (
            <button style={btnStyle} onClick={play} type="button">
              Play
            </button>
          )}
          <button style={btnStyle} onClick={stop} type="button">
            Stop
          </button>
          <span style={{ marginLeft: '4px', opacity: 0.7 }}>
            Measure {currentMeasure + 1}, Beat {currentBeat + 1}
          </span>
          <label style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}>
            BPM:
            <input
              type="range"
              min={40}
              max={300}
              value={currentTempo}
              onChange={(e) => setCurrentTempo(Number(e.target.value))}
              style={{ width: '100px' }}
            />
            <span style={{ minWidth: '32px', fontVariantNumeric: 'tabular-nums' }}>
              {currentTempo}
            </span>
          </label>
        </div>
      )}
    </div>
  )
}
