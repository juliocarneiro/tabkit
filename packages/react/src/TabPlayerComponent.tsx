import { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { TabRenderer, flattenBeat } from 'tabkit'
import { TabPlayer as TabPlayerEngine } from '@tabkit/player'
import type { TabPlayerProps } from './types.js'

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
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentMeasure, setCurrentMeasure] = useState(0)
  const [currentBeat, setCurrentBeat] = useState(0)
  const [currentTempo, setCurrentTempo] = useState(tempo)

  // Keep callback refs up to date without recreating the player
  onBeatRef.current = onBeat
  onNoteRef.current = onNote
  onEndRef.current = onEnd
  onNoteClickRef.current = onNoteClick

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
    ],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.innerHTML = svgString

    const svg = el.querySelector('svg') as SVGSVGElement | null

    const player = new TabPlayerEngine(tabOptions.measures, {
      tempo: currentTempo,
      loop,
      countIn,
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
  }, [svgString, currentTempo, loop, countIn])

  useEffect(() => {
    if (!onNoteClickRef.current) return
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

        onNoteClickRef.current?.(
          matched ?? { string: si, fret: fi, duration: '4n' as import('tabkit').Duration },
          mi,
          bi,
        )
      }
    }

    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [onNoteClick, tabOptions.measures])

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
