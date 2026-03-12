import { describe, it, expect } from 'vitest'
import { parseAsciiTab } from '../src/ascii.js'
import { parseMusicXML } from '../src/musicxml.js'

// ---------------------------------------------------------------------------
// ASCII Tab Parser
// ---------------------------------------------------------------------------

describe('parseAsciiTab', () => {
  it('parses a simple 6-string tab', () => {
    const input = `
e|---0---1---3---|
B|---1---1---0---|
G|---0---2---0---|
D|---2---3---0---|
A|---3---3---2---|
E|---x---1---3---|
`
    const measures = parseAsciiTab(input)
    expect(measures.length).toBeGreaterThanOrEqual(1)
    expect(measures[0].beats.length).toBeGreaterThan(0)
  })

  it('detects muted strings', () => {
    const input = `
e|---x---|
B|---0---|
G|---0---|
D|---0---|
A|---x---|
E|---x---|
`
    const measures = parseAsciiTab(input)
    expect(measures.length).toBeGreaterThanOrEqual(1)

    const allNotes = measures.flatMap((m) =>
      m.beats.flatMap((b) => (Array.isArray(b) ? b : [b])),
    )
    const muted = allNotes.filter((n) => n.technique === 'mute')
    expect(muted.length).toBeGreaterThan(0)
  })

  it('handles two-digit fret numbers', () => {
    const input = `
e|---12---15---|
B|---10---13---|
G|-------------|
D|-------------|
A|-------------|
E|-------------|
`
    const measures = parseAsciiTab(input)
    const allNotes = measures.flatMap((m) =>
      m.beats.flatMap((b) => (Array.isArray(b) ? b : [b])),
    )
    const highFrets = allNotes.filter((n) => n.fret >= 10)
    expect(highFrets.length).toBeGreaterThan(0)
  })

  it('parses multiple measures separated by pipes', () => {
    const input = `
e|---0---|---3---|
B|---1---|---0---|
G|---0---|---0---|
D|---2---|---0---|
A|---3---|---2---|
E|-------|---3---|
`
    const measures = parseAsciiTab(input)
    expect(measures.length).toBe(2)
  })

  it('returns empty array for non-tab input', () => {
    const measures = parseAsciiTab('Hello world, this is not a tab')
    expect(measures).toEqual([])
  })

  it('detects technique markers', () => {
    const input = `
e|---5h7------|
B|------------|
G|------------|
D|------------|
A|------------|
E|------------|
`
    const measures = parseAsciiTab(input)
    const allNotes = measures.flatMap((m) =>
      m.beats.flatMap((b) => (Array.isArray(b) ? b : [b])),
    )
    const hammered = allNotes.find((n) => n.technique === 'hammer')
    expect(hammered).toBeDefined()
  })

  it('uses custom default duration', () => {
    const input = `
e|---0---|
B|---1---|
G|---0---|
D|---2---|
A|---3---|
E|-------|
`
    const measures = parseAsciiTab(input, { defaultDuration: '4n' })
    const allNotes = measures.flatMap((m) =>
      m.beats.flatMap((b) => (Array.isArray(b) ? b : [b])),
    )
    expect(allNotes[0].duration).toBe('4n')
  })
})

// ---------------------------------------------------------------------------
// MusicXML Parser
// ---------------------------------------------------------------------------

describe('parseMusicXML', () => {
  const sampleXML = `
<score-partwise>
  <part id="P1">
    <measure number="1">
      <attributes>
        <time>
          <beats>4</beats>
          <beat-type>4</beat-type>
        </time>
      </attributes>
      <direction>
        <direction-type>
          <words>Intro</words>
        </direction-type>
        <sound tempo="120"/>
      </direction>
      <note>
        <technical>
          <string>6</string>
          <fret>0</fret>
        </technical>
        <type>quarter</type>
      </note>
      <note>
        <technical>
          <string>6</string>
          <fret>3</fret>
        </technical>
        <type>eighth</type>
      </note>
      <note>
        <technical>
          <string>5</string>
          <fret>2</fret>
        </technical>
        <type>eighth</type>
      </note>
    </measure>
    <measure number="2">
      <note>
        <technical>
          <string>4</string>
          <fret>0</fret>
        </technical>
        <type>quarter</type>
      </note>
      <note>
        <rest/>
        <type>quarter</type>
      </note>
      <note>
        <technical>
          <string>3</string>
          <fret>5</fret>
        </technical>
        <type>quarter</type>
        <notations>
          <technical>
            <hammer-on type="start"/>
          </technical>
        </notations>
      </note>
      <note>
        <technical>
          <string>3</string>
          <fret>7</fret>
        </technical>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>
`

  it('parses measures from MusicXML', () => {
    const measures = parseMusicXML(sampleXML)
    expect(measures.length).toBe(2)
  })

  it('extracts time signature', () => {
    const measures = parseMusicXML(sampleXML)
    expect(measures[0].timeSignature).toEqual([4, 4])
  })

  it('extracts label from direction/words', () => {
    const measures = parseMusicXML(sampleXML)
    expect(measures[0].label).toBe('Intro')
  })

  it('extracts tempo from sound element', () => {
    const measures = parseMusicXML(sampleXML)
    expect(measures[0].tempo).toBe(120)
  })

  it('extracts note data correctly', () => {
    const measures = parseMusicXML(sampleXML)
    const firstBeat = Array.isArray(measures[0].beats[0])
      ? measures[0].beats[0][0]
      : measures[0].beats[0]
    expect(firstBeat.string).toBe(6)
    expect(firstBeat.fret).toBe(0)
    expect(firstBeat.duration).toBe('4n')
  })

  it('skips rests', () => {
    const measures = parseMusicXML(sampleXML)
    // Measure 2 has a rest, so should have 3 notes, not 4
    expect(measures[1].beats.length).toBe(3)
  })

  it('detects technique markers', () => {
    const measures = parseMusicXML(sampleXML)
    const allNotes = measures[1].beats.flatMap((b) =>
      Array.isArray(b) ? b : [b],
    )
    const hammered = allNotes.find((n) => n.technique === 'hammer')
    expect(hammered).toBeDefined()
  })

  it('respects maxMeasures option', () => {
    const measures = parseMusicXML(sampleXML, { maxMeasures: 1 })
    expect(measures.length).toBe(1)
  })

  it('returns empty for non-XML input', () => {
    const measures = parseMusicXML('not xml at all')
    expect(measures).toEqual([])
  })

  it('handles tags with attributes (e.g. string placement)', () => {
    const xmlWithAttrs = `
<score-partwise>
  <part id="P1">
    <measure number="1">
      <note>
        <technical><string placement="above">3</string><fret>5</fret></technical>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>
`
    const measures = parseMusicXML(xmlWithAttrs)
    expect(measures.length).toBe(1)
    const note = Array.isArray(measures[0].beats[0])
      ? measures[0].beats[0][0]
      : measures[0].beats[0]
    expect(note.string).toBe(3)
    expect(note.fret).toBe(5)
  })

  it('handles chord notation (simultaneous notes)', () => {
    const chordXML = `
<score-partwise>
  <part id="P1">
    <measure number="1">
      <note>
        <technical><string>4</string><fret>2</fret></technical>
        <type>quarter</type>
      </note>
      <note>
        <chord/>
        <technical><string>3</string><fret>2</fret></technical>
        <type>quarter</type>
      </note>
      <note>
        <chord/>
        <technical><string>2</string><fret>1</fret></technical>
        <type>quarter</type>
      </note>
    </measure>
  </part>
</score-partwise>
`
    const measures = parseMusicXML(chordXML)
    expect(measures.length).toBe(1)
    // All 3 notes should be in a single beat (chord)
    const beat = measures[0].beats[0]
    expect(Array.isArray(beat)).toBe(true)
    if (Array.isArray(beat)) {
      expect(beat.length).toBe(3)
    }
  })
})
