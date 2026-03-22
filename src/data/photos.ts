export interface Photo {
  src: string
  alt: string
}

const photoFiles = import.meta.glob('/public/photos/*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

export const photos: Photo[] = Object.entries(photoFiles)
  .sort(([a], [b]) => {
    const numA = parseInt(a.match(/(\d+)\.webp$/)?.[1] ?? '0')
    const numB = parseInt(b.match(/(\d+)\.webp$/)?.[1] ?? '0')
    return numA - numB
  })
  .map(([, url], i) => ({
    src: url,
    alt: `Photo ${i + 1}`,
  }))
