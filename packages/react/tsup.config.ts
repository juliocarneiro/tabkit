import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  minify: true,
  treeshake: true,
  external: ['react', 'react-dom', 'react/jsx-runtime', '@tabkit/core', '@tabkit/player'],
  esbuildOptions(options) {
    options.jsx = 'automatic'
  },
})
