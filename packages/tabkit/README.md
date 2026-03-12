# @tabkit/core

Modern, responsive SVG tablature renderer for any stringed instrument. Zero dependencies, ~5KB gzipped.

## Install

```bash
npm install @tabkit/core
```

## Quick Start

### Static SVG (SSR / Node.js)

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
new TabRenderer('#container')
  .measures(measures)
  .instrument('guitar')
  .theme('dark')
  .leftHanded(true)
  .layout('responsive')
  .draw()

// Get SVG string without rendering to DOM
const svgString = new TabRenderer()
  .measures(measures)
  .instrument('guitar')
  .toSvg()
```

## Features

- **Zero dependencies** — pure SVG string generation, no DOM needed
- **Responsive reflow** — auto-wraps measures to fit any width
- **Accessible** — ARIA labels, `<title>`, `<desc>`, WCAG 2.1 AA themes
- **Multi-instrument** — guitar, bass, ukulele, banjo, or custom tuning
- **SSR ready** — Node.js, Deno, edge functions
- **Left-handed mode** — full string/note mirroring
- **Technique decorations** — hammer-on, pull-off, slide, bend, vibrato, mute, tap, harmonics
- **Themeable** — light/dark built-in, fully customizable
- **Export** — PNG, SVG data URL, file download

## Instruments

Built-in presets: `'guitar'`, `'bass'`, `'ukulele'`, `'banjo'`.

```typescript
TabRenderer.svg({
  measures: [...],
  instrument: { strings: 7, frets: 24, tuning: ['B','E','A','D','G','B','E'] },
})
```

## Themes

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

| Property | Description |
|---|---|
| `background` | Background color |
| `stringColor` | String line color |
| `fretNumberColor` | Fret number color |
| `barlineColor` | Barline color |
| `cursorColor` | Playback cursor color |
| `textColor` | Label and title color |
| `accentColor` | Highlight color |
| `techniqueColor` | Technique decoration color |
| `fontFamily` | Font family |

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `measures` | `TabMeasure[]` | required | Tablature data |
| `instrument` | `string \| InstrumentConfig` | `'guitar'` | Instrument preset or custom |
| `theme` | `string \| Partial<TabTheme>` | `'light'` | Theme preset or custom |
| `layout` | `'responsive' \| 'fixed'` | `'responsive'` | Layout mode |
| `leftHanded` | `boolean` | `false` | Mirror for left-handed |
| `width` | `number` | `800` | SVG width in pixels |
| `showTuning` | `boolean` | `true` | Show tuning labels |
| `showTimeSignature` | `boolean` | `true` | Show time signature |
| `noteLabels` | `boolean` | `false` | Show note names (C, D#, …) below fret numbers — works for any instrument |
| `onNoteClick` | `(note, measure, beat) => void` | — | Callback when a note is clicked |
| `ariaTitle` | `string` | auto | Custom accessible title |
| `ariaDescription` | `string` | auto | Custom accessible description |

## Chords (Simultaneous Notes)

A beat can be a single `TabNote` or an array of `TabNote[]` for chords:

```typescript
const measures: TabMeasure[] = [
  {
    beats: [
      // Single note
      { string: 6, fret: 0, duration: '4n' },
      // Chord — multiple notes played simultaneously
      [
        { string: 6, fret: 0, duration: '4n' },
        { string: 5, fret: 2, duration: '4n' },
        { string: 4, fret: 2, duration: '4n' },
        { string: 3, fret: 1, duration: '4n' },
        { string: 2, fret: 0, duration: '4n' },
        { string: 1, fret: 0, duration: '4n' },
      ],
    ],
    timeSignature: [4, 4],
  },
]
```

## Repeat Marks

Measures support repeat barlines with an optional repeat count:

```typescript
const measures: TabMeasure[] = [
  {
    beats: [{ string: 6, fret: 0, duration: '4n' }],
    repeat: { start: true },
  },
  {
    beats: [{ string: 5, fret: 2, duration: '4n' }],
    repeat: { end: true, times: 4 },
  },
]
```

## Responsive Reflow

When `layout: 'responsive'` (default), the renderer calculates how many measures fit and breaks into multiple lines automatically.

```typescript
TabRenderer.svg({
  measures: longRiff,
  width: 400,
  layout: 'responsive',
})
```

For programmatic control, use `reflowMeasures()` directly:

```typescript
import { reflowMeasures, resolveInstrument, DEFAULT_LAYOUT } from '@tabkit/core'

const inst = resolveInstrument('guitar')
const result = reflowMeasures(measures, inst, DEFAULT_LAYOUT, 600)

result.lines       // TabLine[] — each line has measures and startMeasureIndex
result.totalHeight // total SVG height in pixels
```

## Techniques

```typescript
{ string: 3, fret: 5, duration: '8n', technique: 'hammer' }
```

Supported: `'hammer'`, `'pull'`, `'slide'`, `'bend'`, `'vibrato'`, `'mute'`, `'tap'`, `'harmonic'`.

Harmonics are rendered with angle brackets (e.g. `⟨12⟩`) to visually distinguish them from regular notes.

## Left-Handed Mode

Use `leftHanded: true` in options for automatic mirroring, or call `mirrorMeasures()` directly:

```typescript
import { mirrorMeasures, resolveInstrument } from '@tabkit/core'

const inst = resolveInstrument('guitar')
const mirrored = mirrorMeasures(measures, inst)
// String numbers are flipped: S1↔S6, S2↔S5, etc.
```

## Accessibility

Auto-generated ARIA labels for screen readers:

```typescript
import { generateAriaTitle, generateAriaDescription, resolveInstrument } from '@tabkit/core'

const inst = resolveInstrument('guitar')
const title = generateAriaTitle({ measures, instrument: 'guitar' }, inst)
const desc = generateAriaDescription({ measures, instrument: 'guitar' }, inst)
```

The SVG output automatically includes `<title>` and `<desc>` elements. Override with `ariaTitle` and `ariaDescription` options.

## Export

```typescript
const dataUrl = TabRenderer.toSVGDataURL(options)
const blob = await TabRenderer.toPNG(options, { scale: 2 })
await TabRenderer.download(options, { filename: 'riff', format: 'png' })
```

### ExportOptions

| Option | Type | Default | Description |
|---|---|---|---|
| `scale` | `number` | `2` | Scale factor for PNG export |
| `filename` | `string` | `'tablature'` | Download filename (without extension) |
| `format` | `'png' \| 'svg'` | `'svg'` | Download format |

## Constants

```typescript
import {
  GUITAR, BASS, UKULELE, BANJO,  // InstrumentConfig presets
  DEFAULT_LAYOUT,                  // LayoutMetrics defaults
  lightTheme, darkTheme,           // TabTheme objects
} from '@tabkit/core'

GUITAR   // { strings: 6, frets: 24, tuning: ['E','B','G','D','A','E'] }
BASS     // { strings: 4, frets: 24, tuning: ['G','D','A','E'] }
UKULELE  // { strings: 4, frets: 18, tuning: ['A','E','C','G'] }
BANJO    // { strings: 5, frets: 22, tuning: ['D','B','G','D','G'] }
```

## Utility Functions

### Resolvers

```typescript
import { resolveInstrument, resolveTheme } from '@tabkit/core'

const inst = resolveInstrument('guitar')    // full InstrumentConfig
const theme = resolveTheme('dark')          // full TabTheme
const custom = resolveTheme({ background: '#000' }) // merges with light defaults
```

### Duration & Measure Helpers

```typescript
import { durationToBeats, measureDurationBeats, flattenBeat } from '@tabkit/core'

durationToBeats('4n')            // 1
durationToBeats('8n')            // 0.5
durationToBeats('2n')            // 2

measureDurationBeats(measure)    // total beats in a measure

// Normalize a beat (single note or chord) into an array
flattenBeat({ string: 1, fret: 0, duration: '4n' })  // [TabNote]
flattenBeat([note1, note2])                            // [note1, note2]
```

### Layout Helpers

```typescript
import { measureWidth, layoutMeasures, DEFAULT_LAYOUT } from '@tabkit/core'

const w = measureWidth(measure, DEFAULT_LAYOUT)  // pixel width of one measure
const positions = layoutMeasures(measures, DEFAULT_LAYOUT, 0)
// [{ measureIndex, x, width }, ...]
```

## Data Types

```typescript
type Duration = '1n' | '2n' | '4n' | '8n' | '16n' | '32n' | '8t' | '4t'
type Technique = 'hammer' | 'pull' | 'slide' | 'bend' | 'vibrato' | 'mute' | 'tap' | 'harmonic'
type TabBeat = TabNote | TabNote[]

interface TabNote {
  string: number          // 1 = thinnest / highest pitch
  fret: number            // 0 = open string
  duration: Duration
  technique?: Technique
  text?: string           // free-form label on the note
  accent?: boolean
  tie?: boolean           // tie to next note on same string
}

interface TabMeasure {
  beats: TabBeat[]
  timeSignature?: [number, number]
  tempo?: number
  label?: string
  repeat?: RepeatMark
}

interface RepeatMark {
  start?: boolean
  end?: boolean
  times?: number          // repeat count (default: 2)
}

interface InstrumentConfig {
  strings: number
  frets: number
  tuning: string[]
  name?: string
}

interface ExportOptions {
  scale?: number          // PNG scale factor (default: 2)
  filename?: string       // download filename without extension
  format?: 'png' | 'svg'
}

interface TabLine {
  measures: TabMeasure[]
  startMeasureIndex: number
}

interface ReflowResult {
  lines: TabLine[]
  totalHeight: number
}
```

## Ecosystem

| Package | Description |
|---------|-------------|
| [`@tabkit/parser`](../parser) | Parse ASCII tabs and MusicXML |
| [`@tabkit/player`](../player) | Playback with cursor and metronome |
| [`@tabkit/audio`](../audio) | Web Audio API synthesis |
| [`@tabkit/react`](../react) | React components and hooks |
| [`chordkit`](https://github.com/juliocarneiro/chordkit) | Chord diagram renderer |

## License

MIT
