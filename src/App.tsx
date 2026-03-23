import { Hero } from './components/Hero/Hero'
import { SocialLinks } from './components/SocialLinks/SocialLinks'
import { InterestTags } from './components/InterestTags/InterestTags'
import { PhotoSlider } from './components/PhotoSlider/PhotoSlider'
import { Scanlines } from './components/effects/Scanlines'
import { useLayout } from './hooks/useColumnCount'
import styles from './App.module.css'

export function App() {
  const { columnCount, isPortrait, showTags } = useLayout()

  const photosStyle = isPortrait
    ? { gridTemplateRows: `repeat(${columnCount}, 1fr)` }
    : { gridTemplateColumns: `repeat(${columnCount}, 1fr)` }

  return (
    <div className={styles.app}>
      <Scanlines />
      <header className={styles.header}>
        <Hero />
        <SocialLinks />
      </header>
      <main className={styles.photos} style={photosStyle}>
        <PhotoSlider columnCount={columnCount} />
      </main>
      <footer className={styles.footer}>
        {showTags && <InterestTags />}
        <p className={styles.copyright}>&copy; {new Date().getFullYear()} koflox</p>
      </footer>
    </div>
  )
}
