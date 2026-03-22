import { interests } from '../../data/interests'
import styles from './InterestTags.module.css'

export function InterestTags() {
  return (
    <div className={styles.container}>
      {interests.map((tag) => (
        <span key={tag} className={styles.tag}>{tag}</span>
      ))}
    </div>
  )
}
