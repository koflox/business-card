import { useState, useEffect, useRef, useCallback } from 'react'
import { photos } from '../../data/photos'
import { pickUniquePhotos, buildExcludeSet, initColumns } from './photoUtils'
import type { ColumnState } from './photoUtils'
import styles from './PhotoSlider.module.css'

const SLIDE_DURATION = 800
const CYCLE_DURATION = 5000
const DRIFT_RANGE = 0.20

const PLACEHOLDER_COLORS = [
  '#0d1117', '#161b22', '#0f1923', '#1a1025',
  '#0f1720', '#121a24', '#1a0d1f', '#0d1520',
]

const preloadedUrls = new Set<string>()

function preloadImage(src: string): Promise<void> {
  if (preloadedUrls.has(src)) return Promise.resolve()
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => { preloadedUrls.add(src); resolve() }
    img.onerror = () => resolve()
    img.src = src
  })
}

function preloadByIndices(indices: number[]): Promise<void> {
  return Promise.all(indices.map(i => preloadImage(photos[i].src))).then(() => {})
}

function preloadAllInBackground() {
  let i = 0
  function next() {
    if (i >= photos.length) return
    preloadImage(photos[i].src).then(() => {
      i++
      requestIdleCallback ? requestIdleCallback(next) : setTimeout(next, 100)
    })
  }
  next()
}

function PhotoCell({ photoIndex, onError }: {
  photoIndex: number
  onError: (src: string) => void
}) {
  const photo = photos[photoIndex]
  return (
    <img
      src={photo.src}
      alt={photo.alt}
      onError={() => onError(photo.src)}
    />
  )
}

function PlaceholderCell({ index }: { index: number }) {
  return (
    <div
      className={styles.placeholder}
      style={{ background: PLACEHOLDER_COLORS[index % PLACEHOLDER_COLORS.length] }}
    >
      photo {String(index + 1).padStart(2, '0')}
    </div>
  )
}

export function PhotoSlider({ columnCount }: { columnCount: number }) {
  const columnsRef = useRef<ColumnState[]>([])
  const [columns, setColumns] = useState<ColumnState[]>(() => {
    const init = initColumns(columnCount, photos.length)
    columnsRef.current = init
    return init
  })
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(new Set())

  const hoveredRef = useRef(new Set<number>())
  const driftsRef = useRef<number[]>([])
  const lastAssignedRef = useRef<number[]>([])
  const slideTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const cancelledRef = useRef(false)

  const updateColumns = useCallback((updater: (prev: ColumnState[]) => ColumnState[]) => {
    const next = updater(columnsRef.current)
    columnsRef.current = next
    setColumns(next)
  }, [])

  const handleImageError = useCallback((src: string) => {
    setFailedSrcs(prev => new Set(prev).add(src))
  }, [])

  const runCycle = useCallback(() => {
    if (photos.length < 2) return

    const maxDrift = DRIFT_RANGE * CYCLE_DURATION
    const count = columnsRef.current.length

    if (driftsRef.current.length !== count) {
      driftsRef.current = Array.from({ length: count }, () =>
        (Math.random() * 2 - 1) * maxDrift
      )
    } else {
      driftsRef.current = driftsRef.current.map(d => -d)
    }

    const exclude = buildExcludeSet(columnsRef.current, lastAssignedRef.current)
    const nextPhotos = pickUniquePhotos(count, exclude, photos.length)
    lastAssignedRef.current = nextPhotos

    slideTimersRef.current.forEach(t => clearTimeout(t))
    slideTimersRef.current = []

    const preloaded = preloadByIndices(nextPhotos)

    for (let i = 0; i < count; i++) {
      const delay = driftsRef.current[i] + maxDrift
      const nextIdx = nextPhotos[i]

      const timer = setTimeout(() => {
        if (cancelledRef.current || hoveredRef.current.has(i)) return

        preloaded.then(() => {
          if (cancelledRef.current || hoveredRef.current.has(i)) return

          updateColumns(prev => {
            const updated = [...prev]
            updated[i] = { ...updated[i], next: nextIdx, transitioning: true }
            return updated
          })

          setTimeout(() => {
            if (cancelledRef.current) return
            updateColumns(prev => {
              const updated = [...prev]
              updated[i] = { current: nextIdx, next: -1, transitioning: false }
              return updated
            })
          }, SLIDE_DURATION)
        })
      }, delay)

      slideTimersRef.current.push(timer)
    }

    cycleTimerRef.current = setTimeout(runCycle, CYCLE_DURATION)
  }, [updateColumns])

  useEffect(() => {
    const init = initColumns(columnCount, photos.length)
    columnsRef.current = init
    setColumns(init)
    driftsRef.current = []
    lastAssignedRef.current = []
    hoveredRef.current.clear()
    cancelledRef.current = false

    preloadByIndices(init.map(c => c.current)).then(() => {
      if (!cancelledRef.current) runCycle()
    })

    preloadAllInBackground()

    return () => {
      cancelledRef.current = true
      if (cycleTimerRef.current) clearTimeout(cycleTimerRef.current)
      slideTimersRef.current.forEach(t => clearTimeout(t))
    }
  }, [columnCount, runCycle])

  const handleMouseEnter = (colIndex: number) => {
    hoveredRef.current.add(colIndex)
  }

  const handleMouseLeave = (colIndex: number) => {
    hoveredRef.current.delete(colIndex)
  }

  if (photos.length === 0) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: columnCount }, (_, i) => (
          <div key={i} className={styles.column}>
            <div className={styles.photo}>
              <PlaceholderCell index={i} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={styles.grid}>
      {columns.map((col, i) => {
        const slideDown = i % 2 === 0
        const exitClass = slideDown ? styles.exitDown : styles.exitUp
        const enterClass = slideDown ? styles.enterFromTop : styles.enterFromBottom

        return (
          <div
            key={i}
            className={styles.column}
            onMouseEnter={() => handleMouseEnter(i)}
            onMouseLeave={() => handleMouseLeave(i)}
          >
            <div className={`${styles.photo} ${col.transitioning ? exitClass : ''}`}>
              {failedSrcs.has(photos[col.current].src)
                ? <PlaceholderCell index={col.current} />
                : <PhotoCell photoIndex={col.current} onError={handleImageError} />
              }
            </div>
            {col.transitioning && col.next >= 0 && (
              <div className={`${styles.photo} ${enterClass}`}>
                {failedSrcs.has(photos[col.next].src)
                  ? <PlaceholderCell index={col.next} />
                  : <PhotoCell photoIndex={col.next} onError={handleImageError} />
                }
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
