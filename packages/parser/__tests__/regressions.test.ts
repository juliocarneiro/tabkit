import { describe, it, expect } from 'vitest'
import { flattenBeat } from '@tabkit/core'
import { parseAsciiTab } from '../src/ascii.js'
import { parseMusicXML } from '../src/musicxml.js'

const frets = (input: string, options?: Parameters<typeof parseAsciiTab>[1]) =>
  parseAsciiTab(input, options).map((m) =>
    m.beats.map((b) => flattenBeat(b).map((note) => `${note.string}:${note.fret}`).join('+')),
  )

describe('parseAsciiTab regressions', () => {
  it('accepts tuning labels with accidentals', () => {
    expect(frets('Eb|--0--|\nBb|--1--|\nF#|--2--|')).toEqual([['1:0+2:1+3:2']])
  })

  it('treats systems separated by a blank line as consecutive measures', () => {
    const input = 'e|--0--|\nB|--1--|\n\ne|--3--|\nB|--5--|'
    expect(frets(input)).toEqual([['1:0+2:1'], ['1:3+2:5']])
  })

  it('separates systems split by text lines', () => {
    const input = 'Verse\ne|--0--|\nB|--1--|\nChorus\ne|--3--|\nB|--5--|'
    expect(frets(input)).toEqual([['1:0+2:1'], ['1:3+2:5']])
  })

  it('splits stacked systems when the string count is given', () => {
    const input = 'e|--0--|\nB|--1--|\ne|--3--|\nB|--5--|'
    expect(frets(input, { strings: 2 })).toEqual([['1:0+2:1'], ['1:3+2:5']])
  })

  it('keeps a note aligned with the second digit of a two-digit fret', () => {
    expect(frets('e|-10-|\nB|--3-|')).toEqual([['1:10+2:3']])
  })

  it('keeps separate beats separate', () => {
    expect(frets('e|-1-2-12-|')).toEqual([['1:1', '1:2', '1:12']])
  })

  it('reads implausible two-digit frets as two notes', () => {
    expect(frets('e|-57-|')).toEqual([['1:5', '1:7']])
  })

  it('parses harmonics written as <12>', () => {
    const [measure] = parseAsciiTab('e|--<12>--|')
    expect(measure.beats).toEqual([{ string: 1, fret: 12, duration: '8n', technique: 'harmonic' }])
  })

  it('handles Windows line endings', () => {
    expect(frets('e|--0--|\r\nB|--1--|\r\n')).toEqual([['1:0+2:1']])
  })
})

describe('parseMusicXML regressions', () => {
  const note = (inner: string) =>
    `<measure number="1"><note>${inner}<notations><technical><string>1</string><fret>5</fret></technical></notations></note></measure>`

  it('maps triplets to triplet durations', () => {
    const tm = '<time-modification><actual-notes>3</actual-notes><normal-notes>2</normal-notes></time-modification>'
    expect(parseMusicXML(note(`<type>eighth</type>${tm}`))[0].beats[0]).toMatchObject({ duration: '8t' })
    expect(parseMusicXML(note(`<type>quarter</type>${tm}`))[0].beats[0]).toMatchObject({ duration: '4t' })
  })

  it('detects muted notes from an x notehead', () => {
    expect(parseMusicXML(note('<type>quarter</type><notehead>x</notehead>'))[0].beats[0]).toMatchObject({
      technique: 'mute',
    })
  })
})
