import { describe, it, expect } from 'vitest'
import { pickUniquePhotos, initColumns, buildExcludeSet, COLUMN_COUNT } from './photoUtils'

describe('pickUniquePhotos', () => {
  const TOTAL = 15

  it('returns the requested number of photos', () => {
    const result = pickUniquePhotos(4, new Set(), TOTAL)
    expect(result).toHaveLength(4)
  })

  it('returns unique indices (no duplicates)', () => {
    const result = pickUniquePhotos(4, new Set(), TOTAL)
    expect(new Set(result).size).toBe(result.length)
  })

  it('does not include excluded indices', () => {
    const exclude = new Set([0, 1, 2, 3])
    const result = pickUniquePhotos(4, exclude, TOTAL)
    for (const idx of result) {
      expect(exclude.has(idx)).toBe(false)
    }
  })

  it('all indices are within valid range [0, total)', () => {
    const result = pickUniquePhotos(4, new Set(), TOTAL)
    for (const idx of result) {
      expect(idx).toBeGreaterThanOrEqual(0)
      expect(idx).toBeLessThan(TOTAL)
    }
  })

  it('works when excluding most photos (tight pool)', () => {
    const exclude = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    const result = pickUniquePhotos(4, exclude, TOTAL)
    expect(result).toHaveLength(4)
    expect(new Set(result).size).toBe(4)
    for (const idx of result) {
      expect(exclude.has(idx)).toBe(false)
    }
  })

  it('returns fewer if not enough available photos', () => {
    const exclude = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12])
    const result = pickUniquePhotos(4, exclude, TOTAL)
    expect(result).toHaveLength(2)
    expect(new Set(result).size).toBe(2)
  })

  it('returns empty array when all excluded', () => {
    const exclude = new Set(Array.from({ length: TOTAL }, (_, i) => i))
    const result = pickUniquePhotos(4, exclude, TOTAL)
    expect(result).toHaveLength(0)
  })

  it('produces different results across multiple calls (randomness)', () => {
    const results = new Set<string>()
    for (let i = 0; i < 20; i++) {
      const r = pickUniquePhotos(4, new Set(), TOTAL)
      results.add(r.sort().join(','))
    }
    expect(results.size).toBeGreaterThan(1)
  })
})

describe('initColumns', () => {
  it('returns COLUMN_COUNT columns', () => {
    const cols = initColumns(COLUMN_COUNT, 15)
    expect(cols).toHaveLength(COLUMN_COUNT)
  })

  it('columns start with sequential indices 0,1,2,3', () => {
    const cols = initColumns(COLUMN_COUNT, 15)
    cols.forEach((col, i) => {
      expect(col.current).toBe(i)
    })
  })

  it('all columns start with transitioning=false and next=-1', () => {
    const cols = initColumns(COLUMN_COUNT, 15)
    for (const col of cols) {
      expect(col.transitioning).toBe(false)
      expect(col.next).toBe(-1)
    }
  })
})

describe('buildExcludeSet', () => {
  it('includes current photo of every column', () => {
    const columns = [
      { current: 0, next: -1, transitioning: false },
      { current: 5, next: -1, transitioning: false },
      { current: 9, next: -1, transitioning: false },
      { current: 12, next: -1, transitioning: false },
    ]
    const exclude = buildExcludeSet(columns, [])
    expect(exclude.has(0)).toBe(true)
    expect(exclude.has(5)).toBe(true)
    expect(exclude.has(9)).toBe(true)
    expect(exclude.has(12)).toBe(true)
  })

  it('includes next photo of columns mid-transition', () => {
    const columns = [
      { current: 0, next: 7, transitioning: true },
      { current: 5, next: -1, transitioning: false },
      { current: 9, next: -1, transitioning: false },
      { current: 12, next: -1, transitioning: false },
    ]
    const exclude = buildExcludeSet(columns, [])
    expect(exclude.has(7)).toBe(true)
  })

  it('does not include next=-1 as an excluded index', () => {
    const columns = [
      { current: 0, next: -1, transitioning: false },
    ]
    const exclude = buildExcludeSet(columns, [])
    expect(exclude.has(-1)).toBe(false)
  })

  it('includes all lastAssigned photos', () => {
    const columns = [
      { current: 4, next: -1, transitioning: false },
    ]
    const lastAssigned = [0, 1, 2, 3]
    const exclude = buildExcludeSet(columns, lastAssigned)
    for (const idx of lastAssigned) {
      expect(exclude.has(idx)).toBe(true)
    }
  })

  it('handles overlap between current and lastAssigned', () => {
    const columns = [
      { current: 2, next: -1, transitioning: false },
      { current: 3, next: -1, transitioning: false },
    ]
    const lastAssigned = [2, 3]
    const exclude = buildExcludeSet(columns, lastAssigned)
    expect(exclude.size).toBe(2)
  })
})

describe('full cycle simulation: no duplicates across columns or consecutive cycles', () => {
  it('3 consecutive cycles produce no duplicate photos on screen', () => {
    const totalPhotos = 15
    let columns = initColumns(COLUMN_COUNT, totalPhotos)
    let lastAssigned: number[] = []

    for (let cycle = 0; cycle < 3; cycle++) {
      const exclude = buildExcludeSet(columns, lastAssigned)
      const nextPhotos = pickUniquePhotos(COLUMN_COUNT, exclude, totalPhotos)

      // next photos must all be unique
      expect(new Set(nextPhotos).size).toBe(COLUMN_COUNT)

      // next photos must not match any currently displayed
      const currentOnScreen = new Set(columns.map(c => c.current))
      for (const idx of nextPhotos) {
        expect(currentOnScreen.has(idx)).toBe(false)
      }

      // next photos must not match previous cycle's assignment
      for (const idx of nextPhotos) {
        expect(lastAssigned.includes(idx)).toBe(false)
      }

      // simulate transition: columns update to next photos
      lastAssigned = nextPhotos
      columns = nextPhotos.map(idx => ({
        current: idx,
        next: -1,
        transitioning: false,
      }))
    }
  })

  it('works correctly when one column is hovered (skipped)', () => {
    const totalPhotos = 15
    let columns = initColumns(COLUMN_COUNT, totalPhotos)
    let lastAssigned: number[] = []

    for (let cycle = 0; cycle < 3; cycle++) {
      const exclude = buildExcludeSet(columns, lastAssigned)
      const nextPhotos = pickUniquePhotos(COLUMN_COUNT, exclude, totalPhotos)

      expect(new Set(nextPhotos).size).toBe(COLUMN_COUNT)

      // simulate: column 0 is hovered, skip its transition
      lastAssigned = nextPhotos
      columns = columns.map((col, i) => {
        if (i === 0) return col // hovered — stays on old photo
        return { current: nextPhotos[i], next: -1, transitioning: false }
      })

      // after partial update: all visible photos must still be unique
      const visible = columns.map(c => c.current)
      expect(new Set(visible).size).toBe(COLUMN_COUNT)
    }
  })

  it('stress test: 50 cycles never produce duplicates', () => {
    const totalPhotos = 15
    let columns = initColumns(COLUMN_COUNT, totalPhotos)
    let lastAssigned: number[] = []

    for (let cycle = 0; cycle < 50; cycle++) {
      const exclude = buildExcludeSet(columns, lastAssigned)
      const nextPhotos = pickUniquePhotos(COLUMN_COUNT, exclude, totalPhotos)

      expect(new Set(nextPhotos).size).toBe(COLUMN_COUNT)

      const currentOnScreen = new Set(columns.map(c => c.current))
      for (const idx of nextPhotos) {
        expect(currentOnScreen.has(idx)).toBe(false)
      }

      lastAssigned = nextPhotos
      columns = nextPhotos.map(idx => ({
        current: idx,
        next: -1,
        transitioning: false,
      }))
    }
  })
})
