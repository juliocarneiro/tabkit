# tabkit

Modern, responsive SVG tablature renderer for any stringed instrument. Zero dependencies, ~5KB gzipped.

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| [`@tabkit/core`](./packages/tabkit) | Core library — SVG rendering, themes, reflow layout, export | `npm install @tabkit/core` |
| [`@tabkit/parser`](./packages/parser) | Parse ASCII tabs and MusicXML into JSON | `npm install @tabkit/parser` |
| [`@tabkit/player`](./packages/player) | Playback engine with cursor sync and metronome | `npm install @tabkit/player` |
| [`@tabkit/react`](./packages/react) | React components and hooks — TabSheet, TabPlayer, TabEditor | `npm install @tabkit/react` |
| [`@tabkit/audio`](./packages/audio) | Web Audio API synthesis — play notes during playback | `npm install @tabkit/audio` |

## Features

- **Zero dependencies** — pure SVG string generation, no DOM library required
- **Responsive reflow** — tablature automatically wraps to fit any screen width
- **Accessible** — ARIA labels, `<title>`, `<desc>` for screen readers, WCAG 2.1 AA compliant themes
- **Multi-instrument** — guitar, bass, ukulele, banjo, or any custom tuning
- **SSR ready** — works in Node.js, Deno, edge functions — no DOM needed
- **Left-handed mode** — mirrors the entire diagram for left-handed players
- **Technique decorations** — hammer-on, pull-off, slide, bend, vibrato, mute, tap, harmonics
- **Playback cursor** — drift-corrected scheduling with animated cursor that follows along with the music
- **Audio synthesis** — dual-oscillator pluck sounds with chorus, humanization, and exponential envelope via `@tabkit/audio`
- **Built-in metronome** — audible click via Web Audio API with drift correction and accent support
- **Themeable** — light/dark themes built-in, fully customizable
- **Export** — PNG, SVG data URL, or direct file download
- **Interactive editor** — click on fret positions to build tabs visually (browser)
- **Tiny** — tree-shakeable, TypeScript-first
- **chordkit integration** — works seamlessly with `@chordkit/theory` for note labels and intervals

## Quick Start

```bash
npm install @tabkit/core
```

### Static SVG string (SSR / Node.js)

```typescript
import { TabRenderer } from '@tabkit/core'

const svg = TabRenderer.svg({
  measures: [
    {
      beats: [
        { string: 6, fret: 0, duration: '4n' },
        { string: 6, fret: 3, duration: '8n' },
        { string: 5, fret: 0, duration: '8n' },
        { string: 5, fret: 2, duration: '4n' },
      ],
      timeSignature: [4, 4],
      tempo: 120,
    },
  ],
  instrument: 'guitar',
  theme: 'dark',
})
```

### Builder API (Browser)

```typescript
import { TabRenderer } from '@tabkit/core'

new TabRenderer('#my-container')
  .measures([
    {
      beats: [
        { string: 6, fret: 0, duration: '4n' },
        { string: 6, fret: 3, duration: '8n' },
        { string: 5, fret: 0, duration: '8n' },
      ],
    },
  ])
  .instrument('guitar')
  .theme('dark')
  .leftHanded(true)
  .layout('responsive')
  .draw()
```

## Instruments

Built-in presets: `'guitar'`, `'bass'`, `'ukulele'`, `'banjo'`.

Or pass a custom config:

```typescript
TabRenderer.svg({
  measures: [...],
  instrument: { strings: 7, frets: 24, tuning: ['B', 'E', 'A', 'D', 'G', 'B', 'E'] },
})
```

## Themes

Two built-in themes: `'light'` and `'dark'`. Customize with a partial object:

```typescript
TabRenderer.svg({
  measures: [...],
  theme: {
    background: '#0d1117',
    fretNumberColor: '#58a6ff',
    stringColor: '#8b949e',
  },
})
```

### Theme properties

| Property | Description |
|---|---|
| `background` | Background color |
| `stringColor` | String line color |
| `fretNumberColor` | Fret number color |
| `barlineColor` | Barline color |
| `cursorColor` | Playback cursor color |
| `textColor` | Label and title color |
| `accentColor` | Highlight color (active note, hover) |
| `techniqueColor` | Technique decoration color (bend, slide) |
| `fontFamily` | Font family for all text |

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `measures` | `TabMeasure[]` | required | Tablature data |
| `instrument` | `string \| InstrumentConfig` | `'guitar'` | Instrument preset or custom config |
| `theme` | `string \| Partial<TabTheme>` | `'light'` | Theme preset or custom |
| `layout` | `'responsive' \| 'fixed'` | `'responsive'` | Layout mode |
| `leftHanded` | `boolean` | `false` | Mirror for left-handed players |
| `width` | `number` | `800` | SVG width in pixels |
| `showTuning` | `boolean` | `true` | Show tuning labels |
| `showTimeSignature` | `boolean` | `true` | Show time signature |
| `noteLabels` | `boolean` | `false` | Show note names (C, D#, …) below fret numbers — works for any instrument |
| `onNoteClick` | `(note, measure, beat) => void` | — | Callback when a note is clicked (browser) |
| `ariaTitle` | `string` | auto | Custom accessible title |
| `ariaDescription` | `string` | auto | Custom accessible description |

## Responsive Reflow

The killer feature. When `layout: 'responsive'` (default), the renderer calculates how many measures fit in the available width and automatically breaks into multiple lines. Each line is a self-contained SVG group with its own string lines, tuning labels, and barlines.

```typescript
TabRenderer.svg({
  measures: longRiff,       // 16 measures
  width: 400,               // narrow mobile screen
  layout: 'responsive',     // breaks into ~4 lines of 4 measures
})
```

## Left-Handed Mode

Mirrors string order and note positions for left-handed players:

```typescript
TabRenderer.svg({
  measures: [...],
  leftHanded: true,
})
```

## Techniques

Each note can include a `technique` property:

```typescript
{
  beats: [
    { string: 3, fret: 5, duration: '8n', technique: 'hammer' },
    { string: 3, fret: 7, duration: '8n' },
    { string: 3, fret: 7, duration: '4n', technique: 'bend' },
    { string: 3, fret: 5, duration: '8n', technique: 'pull' },
    { string: 1, fret: 12, duration: '4n', technique: 'vibrato' },
  ],
}
```

Supported techniques: `'hammer'`, `'pull'`, `'slide'`, `'bend'`, `'vibrato'`, `'mute'`, `'tap'`, `'harmonic'`.

Harmonics are rendered with angle brackets (e.g. `⟨12⟩`) to visually distinguish them from regular notes.

## Export (PNG / Data URL / Download)

```typescript
import { TabRenderer } from '@tabkit/core'

// SVG as base64 data URL
const dataUrl = TabRenderer.toSVGDataURL(options)

// PNG via Canvas (browser-only, async)
const blob = await TabRenderer.toPNG(options, { scale: 2 })

// Direct file download (browser-only)
await TabRenderer.download(options, {
  filename: 'riff',
  format: 'png',
  scale: 2,
})
```

---

## ASCII Tab Parser

Parse classic ASCII tablature into structured JSON:

```bash
npm install @tabkit/parser
```

```typescript
import { parseAsciiTab } from '@tabkit/parser'

const measures = parseAsciiTab(`
e|---0---1---3---|
B|---1---1---0---|
G|---0---2---0---|
D|---2---3---0---|
A|---3---3---2---|
E|---x---1---3---|
`)
```

Supports:
- Single and double-digit fret numbers
- Multiple measures separated by `|`
- Muted strings (`x`)
- Technique markers (`h` = hammer-on, `p` = pull-off, `/` or `\` = slide, `b` = bend, `~` = vibrato)

## MusicXML Parser

```typescript
import { parseMusicXML } from '@tabkit/parser'

const measures = parseMusicXML(xmlString)
```

Extracts notes with string/fret from `<technical>` elements, time signatures, tempo markings, labels, and technique annotations.

---

## Player

Playback engine with drift-corrected scheduling, metronome, and cursor synchronization:

```bash
npm install @tabkit/player
```

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
player.seek(2, 0)    // jump to measure 2, beat 0
player.setTempo(140)
player.destroy()
```

### Metronome

The package also exports a standalone `Metronome` with built-in click sound via Web Audio API:

```typescript
import { Metronome } from '@tabkit/player'

const met = new Metronome({
  tempo: 120,
  sound: true,         // built-in click (default)
  accentFirst: true,   // higher pitch on beat 1
  beatsPerMeasure: 4,
})

met.start()    // starts ticking with audible click
met.tempo = 140
met.stop()
met.destroy()  // release AudioContext
```

---

## Audio

Web Audio API synthesis — play notes during tablature playback:

```bash
npm install @tabkit/audio
```

```typescript
import { TabPlayer } from '@tabkit/player'
import { TabAudio } from '@tabkit/audio'

const audio = new TabAudio({ instrument: 'guitar', waveform: 'triangle' })

const player = new TabPlayer(measures, {
  tempo: 120,
  onNote: (notes, _m, _b, tempo) => audio.playNotes(notes, tempo),
})

player.play() // plays sound!
```

Each note uses dual oscillators (primary + detuned chorus) with micro pitch variation for realistic sound. Waveforms: `'triangle'` (default), `'sine'`, `'square'`, `'sawtooth'`.

---

## React

React components and hooks for building tab UIs:

```bash
npm install @tabkit/react
```

### TabSheet

Static tablature renderer:

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

Tablature with integrated playback controls:

```tsx
import { TabPlayer } from '@tabkit/react'

function App() {
  return (
    <TabPlayer
      measures={measures}
      instrument="guitar"
      theme="dark"
      tempo={120}
      showControls={true}
      onBeat={(measure, beat) => console.log(measure, beat)}
    />
  )
}
```

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

### useTabPlayer hook

Full control over the player instance:

```tsx
import { useTabPlayer } from '@tabkit/react'

function MyPlayer() {
  const { ref, play, pause, stop, seek, isPlaying, currentBeat, setTempo } =
    useTabPlayer({
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
    </div>
  )
}
```

### useTabEditor hook

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
    </div>
  )
}
```

---

## Integration with chordkit

tabkit is designed to work alongside [chordkit](https://github.com/juliocarneiro/chordkit). Here are some integration patterns:

### Note labels

When `noteLabels: true` is set, tabkit displays note names (C, D#, E, …) below fret numbers using built-in pitch calculation. For advanced theory features (intervals, chord identification), use `@chordkit/theory`.

### Chord diagram popovers

Combine `onNoteClick` with chordkit to show chord diagrams when users click on notes:

```tsx
import { TabSheet } from '@tabkit/react'
import { ChordChart } from '@chordkit/react'
import { identifyChord } from '@chordkit/theory'

function TabWithChords() {
  const [activeChord, setActiveChord] = useState(null)

  return (
    <div>
      <TabSheet
        measures={measures}
        onNoteClick={(note) => {
          // Use @chordkit/theory to identify the chord
          // and show a ChordChart popover
        }}
      />
      {activeChord && <ChordChart chord={activeChord} theme="dark" />}
    </div>
  )
}
```

### Interval analysis

Use `@chordkit/theory` to show scale intervals when clicking tab notes — perfect for music theory learning.

---

## Data Types

### TabNote

```typescript
interface TabNote {
  string: number        // 1 = thinnest, 6 = thickest (guitar)
  fret: number          // 0 = open string
  duration: Duration    // '1n' | '2n' | '4n' | '8n' | '16n' | '32n' | '8t' | '4t'
  technique?: Technique // 'hammer' | 'pull' | 'slide' | 'bend' | 'vibrato' | 'mute' | 'tap' | 'harmonic'
  text?: string         // free-form label
  accent?: boolean      // accent marker
  tie?: boolean         // tie to next note
}
```

### TabMeasure

```typescript
interface TabMeasure {
  beats: TabBeat[]                    // TabNote | TabNote[] per beat
  timeSignature?: [number, number]    // e.g. [4, 4]
  tempo?: number                       // BPM
  label?: string                       // "Intro", "Verse", etc.
  repeat?: { start?: boolean; end?: boolean; times?: number }
}
```

## Accessibility

Every generated SVG includes:

- `role="img"` on the root element
- `<title>` with a descriptive title (e.g., "Tablature for guitar, 4 measures")
- `<desc>` with a full textual description of every note
- `aria-labelledby` linking title and description with auto-incrementing unique IDs (safe for multiple tabs on the same page)
- WCAG 2.1 AA compliant contrast in built-in themes

## Contributing

```bash
# Clone the repo
git clone https://github.com/juliocarneiro/tabkit.git
cd tabkit

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```

## License

MIT
