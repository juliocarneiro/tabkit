# @tabkit/player

Playback engine with drift-corrected scheduling and cursor synchronization for [tabkit](../tabkit) tablatures. Also exports a standalone `Metronome` with audible click.

## Install

```bash
npm install @tabkit/player
```

## Quick Start

```typescript
import { TabPlayer } from '@tabkit/player'

const player = new TabPlayer(measures, {
  tempo: 120,
  loop: false,
  countIn: true,
  onBeat: (measure, beat) => console.log(`Beat ${beat} of measure ${measure}`),
  onEnd: () => console.log('Done!'),
})

player.play()
player.pause()
player.stop()
player.seek(2, 0)     // jump to measure 2, beat 0
player.setTempo(140)
player.destroy()
```

## TabPlayer

### Constructor

```typescript
new TabPlayer(measures: TabMeasure[], options?: PlayerOptions)
```

### Options

| Option | Type | Default | Description |
|---|---|---|---|
| `tempo` | `number` | `120` | BPM |
| `loop` | `boolean` | `false` | Loop playback |
| `countIn` | `boolean` | `false` | Silent count-in beats (based on time signature, e.g. 4 beats in 4/4) before playing |
| `onBeat` | `(measure, beat) => void` | — | Fires on every beat |
| `onMeasure` | `(measure) => void` | — | Fires at the start of each measure |
| `onNote` | `(notes, measure, beat, tempo) => void` | — | Fires with the `TabNote[]` data for each beat — wire to `@tabkit/audio` for sound |
| `onEnd` | `() => void` | — | Fires when playback ends |

### Methods

| Method | Description |
|---|---|
| `play()` | Start playback |
| `pause()` | Pause without resetting position |
| `stop()` | Stop and reset to beginning |
| `seek(measure, beat)` | Jump to a specific position |
| `setTempo(bpm)` | Change tempo during playback |
| `attachSvg(svg)` | Attach to an SVG element for cursor visualization |
| `detachSvg()` | Detach from SVG |
| `destroy()` | Stop and clean up |

### State

```typescript
player.isPlaying      // boolean
player.currentMeasure // number
player.currentBeat    // number
player.state          // { isPlaying, currentMeasure, currentBeat, tempo, elapsedMs }
```

## Cursor Sync

The player can attach to a rendered tabkit SVG to animate the playback cursor and highlight active notes:

```typescript
import { TabRenderer } from 'tabkit'
import { TabPlayer } from '@tabkit/player'

const container = document.getElementById('tab')!
container.innerHTML = TabRenderer.svg({ measures, instrument: 'guitar' })

const svg = container.querySelector('svg')!
const player = new TabPlayer(measures, { tempo: 120 })
player.attachSvg(svg)
player.play()
```

The cursor targets `.tk-cursor` line elements and highlights notes via `.tk-note-active` class.

## Metronome

Standalone drift-corrected metronome with built-in click sound via Web Audio API:

```typescript
import { Metronome } from '@tabkit/player'

const met = new Metronome({
  tempo: 120,
  sound: true,           // enable click sound (default: true)
  volume: 0.5,           // click volume 0–1 (default: 0.5)
  accentFirst: true,     // accent beat 1 with higher pitch (default: true)
  beatsPerMeasure: 4,    // for accent pattern (default: 4)
  onTick: () => console.log('tick'),  // optional callback
})

met.start()              // starts ticking with sound
met.tempo = 140          // change tempo live
met.volume = 0.8         // change volume live
met.beatsPerMeasure = 3  // switch to 3/4
met.stop()
met.destroy()            // release AudioContext

met.intervalMs           // current ms between ticks
met.isRunning            // boolean
```

### Metronome Options

| Option | Type | Default | Description |
|---|---|---|---|
| `tempo` | `number` | required | BPM |
| `sound` | `boolean` | `true` | Enable built-in click sound |
| `volume` | `number` | `0.5` | Click volume (0–1) |
| `accentFirst` | `boolean` | `true` | Accent beat 1 with higher pitch |
| `beatsPerMeasure` | `number` | `4` | Beats per measure for accent pattern |
| `onTick` | `() => void` | — | Optional callback on each tick |

Tempo is clamped between 20 and 400 BPM. Sound gracefully degrades in environments without `AudioContext` (Node.js, SSR).

## Ecosystem

| Package | Description |
|---------|-------------|
| [`tabkit`](../tabkit) | Core SVG tablature renderer |
| [`@tabkit/parser`](../parser) | Parse ASCII tabs and MusicXML |
| [`@tabkit/audio`](../audio) | Web Audio API synthesis |
| [`@tabkit/react`](../react) | React components and hooks |

## License

MIT
