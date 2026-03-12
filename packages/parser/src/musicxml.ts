import type { TabMeasure, TabNote, TabBeat, Duration } from 'tabkit'
import type { MusicXMLParseOptions } from './types.js'

/**
 * Map MusicXML <type> values to tabkit Duration tokens.
 */
function xmlTypeToDuration(type: string): Duration {
  switch (type) {
    case 'whole':
      return '1n'
    case 'half':
      return '2n'
    case 'quarter':
      return '4n'
    case 'eighth':
      return '8n'
    case '16th':
      return '16n'
    case '32nd':
      return '32n'
    default:
      return '4n'
  }
}

/**
 * Minimal DOM-independent XML tag extractor.
 * Finds all occurrences of <tagName>...</tagName> within a source string.
 */
function findTags(source: string, tagName: string): string[] {
  const results: string[] = []
  const openTag = `<${tagName}`
  const closeTag = `</${tagName}>`
  let idx = 0

  while (idx < source.length) {
    const start = source.indexOf(openTag, idx)
    if (start === -1) break

    const end = source.indexOf(closeTag, start)
    if (end === -1) break

    results.push(source.slice(start, end + closeTag.length))
    idx = end + closeTag.length
  }

  return results
}

/**
 * Extract the text content of the first occurrence of <tagName> within xml.
 * Handles tags with attributes (e.g. `<string placement="above">6</string>`).
 */
function getTagContent(xml: string, tagName: string): string | undefined {
  const re = new RegExp(`<${tagName}(?:\\s[^>]*)?>([^<]*)</${tagName}>`)
  const m = xml.match(re)
  return m ? m[1].trim() : undefined
}

/**
 * Extract attribute value from an XML tag string.
 */
function getAttr(xml: string, attr: string): string | undefined {
  const re = new RegExp(`${attr}\\s*=\\s*"([^"]*)"`)
  const m = xml.match(re)
  return m ? m[1] : undefined
}

/**
 * Parse a MusicXML string containing tablature notation into TabMeasure[].
 *
 * This is a lightweight parser that handles the subset of MusicXML relevant
 * to tablature: <note>, <technical>/<string>, <technical>/<fret>, <type>,
 * <time>, and <direction>/<words> for labels.
 *
 * For full MusicXML compliance, consider a dedicated parser.
 */
export function parseMusicXML(
  xml: string,
  options?: MusicXMLParseOptions,
): TabMeasure[] {
  const maxMeasures = options?.maxMeasures ?? Infinity
  const measureXmls = findTags(xml, 'measure')
  const measures: TabMeasure[] = []

  for (let mi = 0; mi < measureXmls.length && mi < maxMeasures; mi++) {
    const mXml = measureXmls[mi]
    const beats: TabBeat[] = []

    // Time signature
    let timeSignature: [number, number] | undefined
    const timeTag = findTags(mXml, 'time')[0]
    if (timeTag) {
      const beatsVal = getTagContent(timeTag, 'beats')
      const beatType = getTagContent(timeTag, 'beat-type')
      if (beatsVal && beatType) {
        timeSignature = [parseInt(beatsVal, 10), parseInt(beatType, 10)]
      }
    }

    // Label from <direction><words>
    let label: string | undefined
    const dirTags = findTags(mXml, 'direction')
    for (const dir of dirTags) {
      const words = getTagContent(dir, 'words')
      if (words) {
        label = words
        break
      }
    }

    // Tempo — <sound> is often self-closing: <sound tempo="120"/>
    let tempo: number | undefined
    const soundRe = /<sound\b[^>]*>/g
    let soundMatch: RegExpExecArray | null
    while ((soundMatch = soundRe.exec(mXml)) !== null) {
      const t = getAttr(soundMatch[0], 'tempo')
      if (t) {
        tempo = parseFloat(t)
        break
      }
    }

    // Notes
    const noteTags = findTags(mXml, 'note')
    let chordGroup: TabNote[] = []

    for (const noteXml of noteTags) {
      // Rest
      if (noteXml.includes('<rest')) continue

      const stringVal = getTagContent(noteXml, 'string')
      const fretVal = getTagContent(noteXml, 'fret')
      if (!stringVal || !fretVal) continue

      const typeVal = getTagContent(noteXml, 'type')
      const duration = typeVal ? xmlTypeToDuration(typeVal) : '4n'
      const isChord = noteXml.includes('<chord')

      // Technique detection
      let technique: TabNote['technique'] | undefined
      if (noteXml.includes('<hammer-on')) technique = 'hammer'
      else if (noteXml.includes('<pull-off')) technique = 'pull'
      else if (noteXml.includes('<slide')) technique = 'slide'
      else if (noteXml.includes('<bend')) technique = 'bend'
      else if (noteXml.includes('<harmonic')) technique = 'harmonic'
      else if (noteXml.includes('<tap')) technique = 'tap'

      const note: TabNote = {
        string: parseInt(stringVal, 10),
        fret: parseInt(fretVal, 10),
        duration,
        technique,
      }

      if (isChord) {
        chordGroup.push(note)
      } else {
        // Flush previous chord group
        if (chordGroup.length > 0) {
          beats.push(chordGroup.length === 1 ? chordGroup[0] : chordGroup)
        }
        chordGroup = [note]
      }
    }

    // Flush final group
    if (chordGroup.length > 0) {
      beats.push(chordGroup.length === 1 ? chordGroup[0] : chordGroup)
    }

    if (beats.length > 0 || timeSignature || label) {
      const measure: TabMeasure = { beats }
      if (timeSignature) measure.timeSignature = timeSignature
      if (label) measure.label = label
      if (tempo) measure.tempo = tempo
      measures.push(measure)
    }
  }

  return measures
}
