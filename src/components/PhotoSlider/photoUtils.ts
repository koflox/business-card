export const COLUMN_COUNT = 4

export interface ColumnState {
  current: number
  next: number
  transitioning: boolean
}

export function pickUniquePhotos(count: number, exclude: Set<number>, totalPhotos: number): number[] {
  const available: number[] = []
  for (let i = 0; i < totalPhotos; i++) {
    if (!exclude.has(i)) available.push(i)
  }
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[available[i], available[j]] = [available[j], available[i]]
  }
  return available.slice(0, count)
}

export function buildExcludeSet(columns: ColumnState[], lastAssigned: number[]): Set<number> {
  const exclude = new Set<number>()
  for (const col of columns) {
    exclude.add(col.current)
    if (col.next >= 0) exclude.add(col.next)
  }
  for (const idx of lastAssigned) {
    exclude.add(idx)
  }
  return exclude
}

export function initColumns(columnCount: number, totalPhotos: number): ColumnState[] {
  const indices = pickUniquePhotos(columnCount, new Set(), totalPhotos)
  return indices.map(idx => ({ current: idx, next: -1, transitioning: false }))
}
