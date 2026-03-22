import { useState, useEffect, useRef, useCallback } from 'react'
import { photos } from '../../data/photos'
import styles from './PhotoSlider.module.css'

const COLUMN_COUNT = 4
const SLIDE_DURATION = 800
const MIN_DELAY = 3000
const MAX_DELAY = 6000

const PLACEHOLDER_COLORS = [
  '#0d1117', '#161b22', '#0f1923', '#1a1025',
  '#0f1720', '#121a24', '#1a0d1f', '#0d1520',
]

function randomDelay() {
  return MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY)
}

function randomIndex(exclude: number) {
  if (photos.length <= 1) return 0
  let idx: number
  do {
    idx = Math.floor(Math.random() * photos.length)
  } while (idx === exclude)
  return idx
}

interface ColumnState {
  current: number
  next: number
  transitioning: boolean
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

function initColumns(): ColumnState[] {
  return Array.from({ length: COLUMN_COUNT }, (_, i) => ({
    current: i % photos.length,
    next: -1,
    transitioning: false,
  }))
}

export function PhotoSlider() {
  const [columns, setColumns] = useState<ColumnState[]>(initColumns)
  const [failedSrcs, setFailedSrcs] = useState<Set<string>>(new Set())

  const hoveredRef = useRef(new Set<number>())
  const timersRef = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const handleImageError = useCallback((src: string) => {
    setFailedSrcs(prev => new Set(prev).add(src))
  }, [])

  const scheduleSlide = useCallback((colIndex: number) => {
    if (photos.length < 2) return

    const existing = timersRef.current.get(colIndex)
    if (existing) clearTimeout(existing)

    const timer = setTimeout(() => {
      if (hoveredRef.current.has(colIndex)) return

      setColumns(prev => {
        const col = prev[colIndex]
        const nextIdx = randomIndex(col.current)
        const updated = [...prev]
        updated[colIndex] = { current: col.current, next: nextIdx, transitioning: true }
        return updated
      })

      setTimeout(() => {
        setColumns(prev => {
          const col = prev[colIndex]
          const updated = [...prev]
          updated[colIndex] = { current: col.next, next: -1, transitioning: false }
          return updated
        })
        scheduleSlide(colIndex)
      }, SLIDE_DURATION)
    }, randomDelay())

    timersRef.current.set(colIndex, timer)
  }, [])

  useEffect(() => {
    for (let i = 0; i < COLUMN_COUNT; i++) {
      scheduleSlide(i)
    }
    return () => {
      timersRef.current.forEach(t => clearTimeout(t))
    }
  }, [scheduleSlide])

  const handleMouseEnter = (colIndex: number) => {
    hoveredRef.current.add(colIndex)
    const existing = timersRef.current.get(colIndex)
    if (existing) {
      clearTimeout(existing)
      timersRef.current.delete(colIndex)
    }
  }

  const handleMouseLeave = (colIndex: number) => {
    hoveredRef.current.delete(colIndex)
    scheduleSlide(colIndex)
  }

  if (photos.length === 0) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: COLUMN_COUNT }, (_, i) => (
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
