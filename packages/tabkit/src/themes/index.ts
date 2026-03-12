import type { TabTheme, ThemePreset } from '../types.js'
import { lightTheme } from './light.js'
import { darkTheme } from './dark.js'

export { lightTheme } from './light.js'
export { darkTheme } from './dark.js'

const THEME_MAP: Record<ThemePreset, TabTheme> = {
  light: lightTheme,
  dark: darkTheme,
}

export function resolveTheme(
  input?: ThemePreset | Partial<TabTheme>,
): TabTheme {
  if (!input) return lightTheme
  if (typeof input === 'string') return THEME_MAP[input] ?? lightTheme
  return { ...lightTheme, ...input }
}
