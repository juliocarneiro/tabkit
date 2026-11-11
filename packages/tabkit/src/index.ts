export { TabRenderer } from './TabRenderer.js'

// Types
export type {
  TabNote,
  TabBeat,
  TabMeasure,
  TabLine,
  TabOptions,
  TabTheme,
  ThemePreset,
  InstrumentConfig,
  InstrumentPreset,
  Duration,
  Technique,
  RepeatMark,
  ExportOptions,
  LayoutMetrics,
} from './types.js'

// Instrument presets
export {
  GUITAR,
  BASS,
  UKULELE,
  BANJO,
  resolveInstrument,
  DEFAULT_LAYOUT,
} from './types.js'

// Themes
export { lightTheme, darkTheme, resolveTheme } from './themes/index.js'

// Layout
export { reflowMeasures } from './layout/reflow.js'
export type { ReflowResult } from './layout/reflow.js'
export {
  measureWidth,
  measureContentWidth,
  layoutMeasures,
  timeSignatureFlags,
  TIME_SIGNATURE_WIDTH,
} from './layout/horizontal.js'
export type { MeasureLayout } from './layout/horizontal.js'
export { computeTabLayout } from './layout/compute.js'
export type { TabLayout, LineBox, MeasureBox } from './layout/compute.js'

// Left-handed
export { mirrorMeasures, applyLeftHanded } from './left-handed.js'

// Accessibility
export { generateAriaTitle, generateAriaDescription } from './accessibility.js'

// Utilities
export {
  durationToBeats,
  flattenBeat,
  measureDurationBeats,
  beatDurationBeats,
  beatPixelWidth,
} from './utils.js'
