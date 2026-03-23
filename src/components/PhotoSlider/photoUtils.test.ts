import { describe, it, expect } from 'vitest'
import { pickUniquePhotos, initColumns, buildExcludeSet } from './photoUtils'

const TOTAL = 24

describe('pickUniquePhotos', () => {
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
    const exclude = new Set(Array.from({ length: TOTAL - 4 }, (_, i) => i))
    const result = pickUniquePhotos(4, exclude, TOTAL)
    expect(result).toHaveLength(4)
    expect(new Set(result).size).toBe(4)
    for (const idx of result) {
      expect(exclude.has(idx)).toBe(false)
    }
  })

  it('returns fewer if not enough available photos', () => {
    const exclude = new Set(Array.from({ length: TOTAL - 2 }, (_, i) => i))
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

  it('works with different column counts', () => {
    for (const count of [2, 3, 4, 5]) {
      const result = pickUniquePhotos(count, new Set(), TOTAL)
      expect(result).toHaveLength(count)
      expect(new Set(result).size).toBe(count)
    }
  })
})

describe('initColumns', () => {
  it('returns requested number of columns', () => {
    for (const count of [2, 3, 4]) {
      const cols = initColumns(count, TOTAL)
      expect(cols).toHaveLength(count)
    }
  })

  it('columns start with sequential indices 0,1,2,...', () => {
    const cols = initColumns(4, TOTAL)
    cols.forEach((col, i) => {
      expect(col.current).toBe(i)
    })
  })

  it('all columns start with transitioning=false and next=-1', () => {
    const cols = initColumns(3, TOTAL)
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
    ]
    const exclude = buildExcludeSet(columns, [])
    expect(exclude.has(0)).toBe(true)
    expect(exclude.has(5)).toBe(true)
    expect(exclude.has(9)).toBe(true)
  })

  it('includes next photo of columns mid-transition', () => {
    const columns = [
      { current: 0, next: 7, transitioning: true },
      { current: 5, next: -1, transitioning: false },
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

describe('full cycle simulation', () => {
  for (const columnCount of [3, 4]) {
    describe(`${columnCount} columns: no duplicates across columns or consecutive cycles`, () => {
      it('3 consecutive cycles produce no duplicate photos on screen', () => {
        let columns = initColumns(columnCount, TOTAL)
        let lastAssigned: number[] = []

        for (let cycle = 0; cycle < 3; cycle++) {
          const exclude = buildExcludeSet(columns, lastAssigned)
          const nextPhotos = pickUniquePhotos(columnCount, exclude, TOTAL)

          expect(new Set(nextPhotos).size).toBe(columnCount)

          const currentOnScreen = new Set(columns.map(c => c.current))
          for (const idx of nextPhotos) {
            expect(currentOnScreen.has(idx)).toBe(false)
          }

          for (const idx of nextPhotos) {
            expect(lastAssigned.includes(idx)).toBe(false)
          }

          lastAssigned = nextPhotos
          columns = nextPhotos.map(idx => ({
            current: idx,
            next: -1,
            transitioning: false,
          }))
        }
      })

      it('works correctly when one column is hovered (skipped)', () => {
        let columns = initColumns(columnCount, TOTAL)
        let lastAssigned: number[] = []

        for (let cycle = 0; cycle < 3; cycle++) {
          const exclude = buildExcludeSet(columns, lastAssigned)
          const nextPhotos = pickUniquePhotos(columnCount, exclude, TOTAL)

          expect(new Set(nextPhotos).size).toBe(columnCount)

          lastAssigned = nextPhotos
          columns = columns.map((col, i) => {
            if (i === 0) return col
            return { current: nextPhotos[i], next: -1, transitioning: false }
          })

          const visible = columns.map(c => c.current)
          expect(new Set(visible).size).toBe(columnCount)
        }
      })

      it('stress test: 50 cycles never produce duplicates', () => {
        let columns = initColumns(columnCount, TOTAL)
        let lastAssigned: number[] = []

        for (let cycle = 0; cycle < 50; cycle++) {
          const exclude = buildExcludeSet(columns, lastAssigned)
          const nextPhotos = pickUniquePhotos(columnCount, exclude, TOTAL)

          expect(new Set(nextPhotos).size).toBe(columnCount)

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
  }
})
