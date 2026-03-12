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
export { measureWidth, layoutMeasures } from './layout/horizontal.js'

// Left-handed
export { mirrorMeasures, applyLeftHanded } from './left-handed.js'

// Accessibility
export { generateAriaTitle, generateAriaDescription } from './accessibility.js'

// Utilities
export { durationToBeats, flattenBeat, measureDurationBeats } from './utils.js'
