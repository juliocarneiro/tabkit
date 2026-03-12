# @tabkit/audio

Web Audio API synthesis engine for [tabkit](../tabkit) — play notes during tablature playback.

## Install

```bash
npm install @tabkit/audio
```

Peer dependency: `@tabkit/core ^0.1.0`.

## Quick Start

```typescript
import { TabPlayer } from '@tabkit/player'
import { TabAudio } from '@tabkit/audio'

const audio = new TabAudio({ instrument: 'guitar', waveform: 'triangle' })

const player = new TabPlayer(measures, {
  tempo: 120,
  onNote: (notes, _m, _b, tempo) => audio.playNotes(notes, tempo),
})

player.play() // now plays sound!
```

With React:

```tsx
import { TabPlayer } from '@tabkit/react'
import { TabAudio } from '@tabkit/audio'

function App() {
  const audioRef = useRef<TabAudio | null>(null)

  useEffect(() => {
    const a = new TabAudio({ instrument: 'guitar' })
    audioRef.current = a
    return () => a.destroy()
  }, [])

  return (
    <TabPlayer
      measures={measures}
      onNote={(notes, _m, _b, tempo) => audioRef.current?.playNotes(notes, tempo)}
    />
  )
}
```

## TabAudio

### Constructor

```typescript
new TabAudio(options?: AudioOptions)
```

### AudioOptions

| Option | Type | Default | Description |
|---|---|---|---|
| `volume` | `number` | `0.7` | Master volume (0–1) |
| `waveform` | `OscillatorType` | `'triangle'` | Oscillator waveform (`'sine'`, `'triangle'`, `'square'`, `'sawtooth'`) |
| `instrument` | `InstrumentPreset \| InstrumentConfig` | `'guitar'` | Instrument tuning for pitch mapping |

### Methods

| Method | Description |
|---|---|
| `playNote(note, tempo?)` | Play a single `TabNote` |
| `playNotes(notes, tempo?)` | Play all notes in a beat simultaneously (chords) |
| `setInstrument(instrument)` | Change the instrument tuning |
| `setVolume(volume)` | Set master volume (0–1) |
| `setWaveform(waveform)` | Set oscillator waveform for future notes |
| `mute()` | Mute all output |
| `unmute()` | Unmute output |
| `destroy()` | Close the AudioContext and release resources |

### Properties

| Property | Type | Description |
|---|---|---|
| `isMuted` | `boolean` | Whether audio is muted |
| `volume` | `number` | Current volume level |

## Low-level API

### Synth

Direct access to the synthesis engine. Each tone uses a dual-oscillator design (primary + detuned chorus) with micro pitch variation for a richer, more realistic sound:

```typescript
import { Synth } from '@tabkit/audio'

const synth = new Synth()
synth.playTone(440, 0.5, { waveform: 'triangle', volume: 0.7 })
synth.destroy()
```

### Pitch utilities

```typescript
import { fretToMidi, midiToFrequency, fretToFrequency, TUNING_MIDI } from '@tabkit/audio'

fretToMidi(guitarConfig, 1, 0)    // 64 (high E open)
fretToMidi(guitarConfig, 6, 5)    // 45 (A on low E)
midiToFrequency(69)               // 440 (A4)
fretToFrequency(guitarConfig, 1, 12) // ~659.26 Hz (E5)
```

### TUNING_MIDI

Pre-defined open-string MIDI numbers (thick → thin):

| Instrument | MIDI values |
|---|---|
| Guitar | 40, 45, 50, 55, 59, 64 |
| Bass | 28, 33, 38, 43 |
| Ukulele | 67, 60, 64, 69 |
| Banjo | 67, 50, 55, 59, 62 |

### Envelope

ADSR envelope with exponential decay/release for natural pluck sounds:

```typescript
import { applyEnvelope, PLUCK_ENVELOPE } from '@tabkit/audio'

// PLUCK_ENVELOPE = { attack: 0.003, decay: 0.15, sustain: 0.15, release: 0.3 }
```

## Ecosystem

| Package | Description |
|---------|-------------|
| [`@tabkit/core`](../tabkit) | Core SVG tablature renderer |
| [`@tabkit/parser`](../parser) | Parse ASCII tabs and MusicXML |
| [`@tabkit/player`](../player) | Playback with cursor and metronome |
| [`@tabkit/react`](../react) | React components and hooks |

## License

MIT
