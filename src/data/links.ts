export interface SocialLink {
  label: string
  url: string
  icon: 'github' | 'leetcode' | 'linkedin'
}

export const socialLinks: SocialLink[] = [
  {
    label: 'GitHub',
    url: 'https://github.com/koflox',
    icon: 'github',
  },
  {
    label: 'LeetCode',
    url: 'https://leetcode.com/u/koflox',
    icon: 'leetcode',
  },
  {
    label: 'LinkedIn',
    url: 'https://linkedin.com/in/koflox',
    icon: 'linkedin',
  },
]
