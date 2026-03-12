import type { TabMeasure, TabLine, LayoutMetrics, InstrumentConfig } from '../types.js'
import { measureWidth } from './horizontal.js'

export interface ReflowResult {
  lines: TabLine[]
  totalHeight: number
}

/**
 * Break measures into multiple lines that fit within `availableWidth`.
 * Each TabLine contains the measures that fit on that row.
 *
 * The reflow algorithm greedily fills each line, inserting a break
 * when the next measure would overflow.
 */
export function reflowMeasures(
  measures: TabMeasure[],
  instrument: InstrumentConfig,
  layoutMetrics: LayoutMetrics,
  availableWidth: number,
  showTuning = true,
): ReflowResult {
  const contentWidth =
    availableWidth - layoutMetrics.marginLeft - layoutMetrics.marginRight

  const tuningOffset = showTuning ? layoutMetrics.tuningWidth : 0
  const usable = contentWidth - tuningOffset

  const lines: TabLine[] = []
  let currentLine: TabMeasure[] = []
  let currentWidth = 0
  let startIdx = 0

  for (let i = 0; i < measures.length; i++) {
    const w = measureWidth(measures[i], layoutMetrics)

    if (currentLine.length > 0 && currentWidth + w > usable) {
      lines.push({ measures: currentLine, startMeasureIndex: startIdx })
      currentLine = []
      currentWidth = 0
      startIdx = i
    }

    currentLine.push(measures[i])
    currentWidth += w
  }

  if (currentLine.length > 0) {
    lines.push({ measures: currentLine, startMeasureIndex: startIdx })
  }

  const stringHeight = (instrument.strings - 1) * layoutMetrics.stringSpacing
  const lineHeight = layoutMetrics.marginTop + stringHeight + layoutMetrics.marginBottom
  const totalHeight =
    lines.length * lineHeight + Math.max(0, lines.length - 1) * layoutMetrics.lineGap

  return { lines, totalHeight }
}
