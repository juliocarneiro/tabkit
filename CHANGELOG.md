# Changelog

## 0.2.0

All five packages move to `0.2.0` together. Packages that depend on
`@tabkit/core` / `@tabkit/player` now require `^0.2.0`.

### @tabkit/core

**Fixed**

- `layout: 'fixed'` no longer clips: the SVG grows to fit the single row. A
  responsive layout also grows when one measure is wider than `width`.
- Reflow accounts for the room taken by time signatures (lines could overflow
  by 24px).
- Repeat dots were drawn on top of each other; they now sit in the two spaces
  around the middle of the staff.
- A measure with `repeat: { start: true, end: true }` drew both signs on both
  of its barlines. Start signs are drawn on the measure that declares them.
- `noteLabels` showed the wrong note names in left-handed mode.
- Tuning labels were partly outside the SVG; they now sit in the tuning gutter
  and the string lines start after them.
- Tuning labels and theme values are escaped (they could inject markup).
- An empty measure is as wide in the SVG as `measureWidth()` reports.
- `new TabRenderer(element)` no longer throws where `HTMLElement` is undefined.

**Changed**

- The time signature is drawn where it starts or changes, instead of on every
  line whose first measure declares one.
- Very short notes (16th/32nd) get a minimum slot (`minBeatWidth`, 20px) so
  fret numbers no longer overlap.

**Added**

- `computeTabLayout(options)` — position of every line and measure, the same
  numbers the renderer uses.
- `id` option for deterministic title/desc ids.
- `timeSignatureFlags`, `measureContentWidth`, `beatDurationBeats`,
  `beatPixelWidth`, `TIME_SIGNATURE_WIDTH`.
- The note background box carries the same `data-*` attributes as the fret
  number, so the whole box is clickable.

### @tabkit/parser

**Fixed**

- ASCII: lines with a two-character tuning label (`Eb|`, `F#|`) were dropped.
- ASCII: a second system was read as extra strings of the first one. Systems
  separated by a blank line or any non-tab line are now consecutive measures.
- ASCII: a note aligned with the second digit of a two-digit fret on another
  string was lost.

**Added**

- ASCII: `strings` option for systems stacked without a blank line, `<12>`
  harmonics, `s` (slide) and `t` (tap) markers.
- MusicXML: triplets map to `8t` / `4t`; `x` noteheads map to `mute`.

### @tabkit/player

**Fixed**

- `Metronome`: the first interval lasted twice as long, and changing the tempo
  while running caused a gap.
- `TabPlayer`: a measure without `timeSignature` was padded as 4/4 instead of
  inheriting the previous time signature.
- `Metronome`: the initial tempo is clamped like later changes.

**Added**

- `TabPlayer.setLoop(loop)` and the `onCountIn(beat, total)` callback.

### @tabkit/audio

**Fixed**

- A custom tuning on a built-in instrument (e.g. drop D on `guitar`) was
  ignored, and unnamed instruments could land an octave off.
- `setVolume` was applied twice (per note and on the master gain).
- `unmute()` restored full volume instead of the volume that was set.
- No `AudioContext` is created before the first note, and nothing throws where
  Web Audio is unavailable (SSR).

**Added**

- `openStringMidi(instrument)`; tuning labels may carry an octave (`'E2'`).

### @tabkit/react

**Fixed**

- `TabPlayer` / `useTabPlayer`: changing the tempo (BPM slider) or `loop`
  destroyed the player while the UI kept showing it as playing. Both are now
  applied to the live player, and the `tempo` prop is honoured after mount.
- `useTabEditor`: undo/redo ran side effects inside state updaters, which
  duplicated history and `onChange` calls under StrictMode.
- `TabEditor`: clicks are hit-tested against the real layout (wrong measure
  before; second line onwards and scaled SVGs were ignored).

**Added**

- `useTabPlayer({ countIn })`, `useTabEditor` returns `canUndo` / `canRedo`.
