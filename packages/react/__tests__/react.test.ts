import { describe, it, expect } from 'vitest'

// Basic smoke tests for exports — full component testing requires jsdom/RTL
describe('@tabkit/react exports', () => {
  it('exports TabSheet component', async () => {
    const mod = await import('../src/index.js')
    expect(typeof mod.TabSheet).toBe('function')
  })

  it('exports TabPlayer component', async () => {
    const mod = await import('../src/index.js')
    expect(typeof mod.TabPlayer).toBe('function')
  })

  it('exports TabEditor component', async () => {
    const mod = await import('../src/index.js')
    expect(typeof mod.TabEditor).toBe('function')
  })

  it('exports useTabPlayer hook', async () => {
    const mod = await import('../src/index.js')
    expect(typeof mod.useTabPlayer).toBe('function')
  })

  it('exports useTabEditor hook', async () => {
    const mod = await import('../src/index.js')
    expect(typeof mod.useTabEditor).toBe('function')
  })
})
