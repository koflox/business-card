import styles from './Hero.module.css'

export function Hero() {
  return (
    <div className={styles.hero}>
      <h1 className={styles.title}>koflox</h1>
      <p className={styles.subtitle}>Software Engineer</p>
    </div>
  )
}
