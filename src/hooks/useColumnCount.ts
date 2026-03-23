import { useSyncExternalStore } from 'react'

const PORTRAIT_HEIGHT_THRESHOLD = 800

const landscapeMobile = '(orientation: landscape) and (max-width: 1023px)'
const portrait = '(orientation: portrait)'

export interface LayoutInfo {
  columnCount: number
  isPortrait: boolean
  isCompact: boolean
}

function getLayout(): LayoutInfo {
  if (typeof window === 'undefined') return { columnCount: 4, isPortrait: false, isCompact: false }

  const isPortrait = window.matchMedia(portrait).matches
  const isMobileLandscape = window.matchMedia(landscapeMobile).matches

  if (isPortrait) {
    const isTall = window.innerHeight >= PORTRAIT_HEIGHT_THRESHOLD
    return { columnCount: isTall ? 4 : 3, isPortrait: true, isCompact: !isTall }
  }

  if (isMobileLandscape) {
    return { columnCount: 3, isPortrait: false, isCompact: true }
  }

  return { columnCount: 4, isPortrait: false, isCompact: false }
}

let cached: LayoutInfo = getLayout()

function getSnapshot(): LayoutInfo {
  return cached
}

function subscribe(cb: () => void): () => void {
  const mql1 = window.matchMedia(landscapeMobile)
  const mql2 = window.matchMedia(portrait)
  const handler = () => {
    cached = getLayout()
    cb()
  }
  mql1.addEventListener('change', handler)
  mql2.addEventListener('change', handler)
  window.addEventListener('resize', handler)
  return () => {
    mql1.removeEventListener('change', handler)
    mql2.removeEventListener('change', handler)
    window.removeEventListener('resize', handler)
  }
}

export function useLayout(): LayoutInfo {
  return useSyncExternalStore(subscribe, getSnapshot, () => ({ columnCount: 4, isPortrait: false, isCompact: false }))
}
