# @tabkit/react

React components and hooks for [tabkit](../tabkit) — render, play, and edit tablatures.

## Install

```bash
npm install @tabkit/react
```

Peer dependencies: `react >= 17`, `react-dom >= 17`, `@tabkit/player ^0.1.0`.

## Components

### TabSheet

Static tablature renderer. Accepts all `TabOptions` plus `className` and `style`:

```tsx
import { TabSheet } from '@tabkit/react'

function App() {
  return (
    <TabSheet
      measures={measures}
      instrument="guitar"
      theme="dark"
      layout="responsive"
      width={800}
      onNoteClick={(note, measure, beat) => console.log(note)}
    />
  )
}
```

### TabPlayer

Tablature with integrated playback controls (play/pause/stop + tempo slider):

```tsx
import { TabPlayer } from '@tabkit/react'

function App() {
  return (
    <TabPlayer
      measures={measures}
      instrument="guitar"
      theme="dark"
      tempo={120}
      loop={false}
      showControls={true}
      onBeat={(measure, beat) => console.log(measure, beat)}
      onEnd={() => console.log('done')}
    />
  )
}
```

#### TabPlayer Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `tempo` | `number` | `120` | BPM |
| `loop` | `boolean` | `false` | Loop playback |
| `countIn` | `boolean` | `false` | Silent count-in beats (based on time signature) before playing |
| `showControls` | `boolean` | `true` | Show built-in play/pause/stop/tempo UI |
| `onBeat` | `(measure, beat) => void` | — | Beat callback |
| `onNote` | `(notes, measure, beat, tempo) => void` | — | Note callback — wire to `@tabkit/audio` for sound |
| `onEnd` | `() => void` | — | End callback |

Plus all `TabSheet` props.

### TabEditor

Interactive editor — click on a string position to open an inline fret input. Browser-only, renders empty div during SSR:

```tsx
import { TabEditor } from '@tabkit/react'

function App() {
  return (
    <TabEditor
      instrument="guitar"
      theme="light"
      measures={4}
      onChange={(measures) => console.log(measures)}
    />
  )
}
```

## Hooks

### useTabPlayer

Full control over a player instance:

```tsx
import { useTabPlayer } from '@tabkit/react'

function MyPlayer() {
  const {
    ref,
    play,
    pause,
    stop,
    seek,
    isPlaying,
    currentMeasure,
    currentBeat,
    setTempo,
  } = useTabPlayer({
    measures,
    instrument: 'guitar',
    tempo: 120,
    onBeat: (m, b) => console.log('beat', m, b),
  })

  return (
    <div>
      <div ref={ref} />
      <button onClick={play}>Play</button>
      <button onClick={pause}>Pause</button>
      <button onClick={stop}>Stop</button>
      <span>Beat: {currentBeat}</span>
    </div>
  )
}
```

#### useTabPlayer Options

| Option | Type | Default | Description |
|---|---|---|---|
| `measures` | `TabMeasure[]` | required | Tablature data |
| `instrument` | `string \| InstrumentConfig` | `'guitar'` | Instrument |
| `theme` | `string \| Partial<TabTheme>` | `'light'` | Theme |
| `tempo` | `number` | `120` | BPM |
| `loop` | `boolean` | `false` | Loop playback |
| `width` | `number` | — | SVG width |
| `leftHanded` | `boolean` | `false` | Left-handed mode |
| `onBeat` | `(measure, beat) => void` | — | Beat callback |
| `onNote` | `(notes, measure, beat, tempo) => void` | — | Note callback — wire to `@tabkit/audio` for sound |
| `onEnd` | `() => void` | — | End callback |

#### useTabPlayer Return

| Property | Type | Description |
|---|---|---|
| `ref` | `RefObject<HTMLDivElement>` | Attach to container div |
| `play` | `() => void` | Start playback |
| `pause` | `() => void` | Pause |
| `stop` | `() => void` | Stop and reset |
| `seek` | `(measure, beat) => void` | Jump to position |
| `isPlaying` | `boolean` | Current state |
| `currentMeasure` | `number` | Active measure index |
| `currentBeat` | `number` | Active beat index |
| `setTempo` | `(bpm) => void` | Change tempo |

### useTabEditor

Full control over the editor with undo/redo:

```tsx
import { useTabEditor } from '@tabkit/react'

function MyEditor() {
  const { ref, measures, setMeasures, clear, undo, redo } = useTabEditor({
    instrument: 'guitar',
    theme: 'dark',
    onChange: (m) => console.log('changed', m),
  })

  return (
    <div>
      <div ref={ref} />
      <button onClick={undo}>Undo</button>
      <button onClick={redo}>Redo</button>
      <button onClick={clear}>Clear</button>
      <pre>{JSON.stringify(measures, null, 2)}</pre>
    </div>
  )
}
```

#### useTabEditor Return

| Property | Type | Description |
|---|---|---|
| `ref` | `RefObject<HTMLDivElement>` | Attach to container div |
| `measures` | `TabMeasure[]` | Current measures state |
| `setMeasures` | `(m) => void` | Update measures (pushes to undo stack) |
| `clear` | `() => void` | Reset to empty measures |
| `undo` | `() => void` | Undo last change |
| `redo` | `() => void` | Redo last undo |

## Integration with chordkit

Combine with [chordkit](https://github.com/juliocarneiro/chordkit) for chord diagram popovers:

```tsx
import { TabSheet } from '@tabkit/react'
import { ChordChart } from '@chordkit/react'

function TabWithChords() {
  const [activeChord, setActiveChord] = useState(null)

  return (
    <div>
      <TabSheet
        measures={measures}
        onNoteClick={(note) => {
          // identify chord via @chordkit/theory, show diagram
        }}
      />
      {activeChord && <ChordChart chord={activeChord} theme="dark" />}
    </div>
  )
}
```

## Ecosystem

| Package | Description |
|---------|-------------|
| [`tabkit`](../tabkit) | Core SVG tablature renderer |
| [`@tabkit/parser`](../parser) | Parse ASCII tabs and MusicXML |
| [`@tabkit/player`](../player) | Playback with cursor and metronome |
| [`@tabkit/audio`](../audio) | Web Audio API synthesis |

## License

MIT
