# @tabkit/parser

Parse ASCII tablature and MusicXML into structured JSON for use with [tabkit](../tabkit).

## Install

```bash
npm install @tabkit/parser
```

## ASCII Tab Parser

Convert classic text-based tablature into `TabMeasure[]`:

```typescript
import { parseAsciiTab } from '@tabkit/parser'

const measures = parseAsciiTab(`
e|---0---1---3---|---0---1---3---|
B|---1---1---0---|---1---1---0---|
G|---0---2---0---|---0---2---0---|
D|---2---3---0---|---2---3---0---|
A|---3---3---2---|---3---3---2---|
E|---x---1---3---|---x---1---3---|
`)
```

### Supported syntax

- Single and double-digit fret numbers (`0`-`24`)
- Multiple measures separated by `|`
- Muted strings (`x` or `X`)
- Technique markers:
  - `h` — hammer-on
  - `p` — pull-off
  - `/` or `\` — slide
  - `b` — bend
  - `~` — vibrato

### Options

```typescript
parseAsciiTab(input, {
  defaultDuration: '4n',   // default: '8n'
})
```

## MusicXML Parser

Parse MusicXML tablature notation into `TabMeasure[]`:

```typescript
import { parseMusicXML } from '@tabkit/parser'

const measures = parseMusicXML(xmlString)
```

Extracts:
- Notes with string/fret from `<technical>` elements (handles tags with attributes, e.g. `<string placement="above">`)
- Time signatures from `<time>`
- Tempo from `<sound tempo="...">`
- Labels from `<direction>/<words>`
- Techniques: hammer-on, pull-off, slide, bend, harmonic, tap
- Chord notation (simultaneous notes via `<chord/>`)

### Options

```typescript
parseMusicXML(xmlString, {
  maxMeasures: 10,   // limit number of measures parsed
})
```

## Output Format

Both parsers return `TabMeasure[]`, compatible with `@tabkit/core`:

```typescript
import { parseAsciiTab } from '@tabkit/parser'
import { TabRenderer } from '@tabkit/core'

const measures = parseAsciiTab(asciiTab)
const svg = TabRenderer.svg({ measures, instrument: 'guitar', theme: 'dark' })
```

## Ecosystem

| Package | Description |
|---------|-------------|
| [`@tabkit/core`](../tabkit) | Core SVG tablature renderer |
| [`@tabkit/player`](../player) | Playback with cursor and metronome |
| [`@tabkit/audio`](../audio) | Web Audio API synthesis |
| [`@tabkit/react`](../react) | React components and hooks |

## License

MIT
