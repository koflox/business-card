import { Hero } from './components/Hero/Hero'
import { SocialLinks } from './components/SocialLinks/SocialLinks'
import { InterestTags } from './components/InterestTags/InterestTags'
import { PhotoSlider } from './components/PhotoSlider/PhotoSlider'
import { Scanlines } from './components/effects/Scanlines'
import styles from './App.module.css'

export function App() {
  return (
    <div className={styles.app}>
      <Scanlines />
      <aside className={styles.sidebar}>
        <div className={styles.sidebarTop}>
          <Hero />
          <SocialLinks />
        </div>
        <div className={styles.sidebarBottom}>
          <InterestTags />
          <p className={styles.copyright}>&copy; {new Date().getFullYear()} koflox</p>
        </div>
      </aside>
      <main className={styles.photos}>
        <PhotoSlider />
      </main>
    </div>
  )
}
