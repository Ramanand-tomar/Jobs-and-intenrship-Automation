import React from 'react'
import { Text, View, Link } from '@react-pdf/renderer'
import { styles } from '../styles'

export interface FlexibleProjectItem {
  title?: string
  name?: string
  tech?: string[]
  technologies?: string[]
  techUsed?: string[]
  start?: string
  end?: string
  start_date?: string
  end_date?: string
  description?: string
  bullets?: string[]
  link?: string
  url?: string
  github?: string
  github_url?: string
  live?: string
  live_url?: string
}

export interface ProjectItemProps {
  item: FlexibleProjectItem
}

export function ProjectItem({ item }: ProjectItemProps) {
  const title = item.title || item.name || 'Project'
  const techList = item.tech || item.technologies || item.techUsed || []
  const techString = techList.length > 0 ? techList.join(', ') : ''

  const startDate = item.start_date || item.start || ''
  const endDate = item.end_date || item.end || ''
  const dateRange = startDate && endDate && startDate !== endDate 
    ? `${startDate} - ${endDate}`
    : startDate || endDate || ''

  const projectUrl = item.live || item.live_url || item.link || item.github || item.github_url || item.url || ''
  const cleanLink = projectUrl.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')

  const bullets: string[] = item.bullets && item.bullets.length > 0
    ? item.bullets
    : item.description
      ? item.description.split('\n').filter(b => b.trim().length > 0)
      : []

  return (
    <View style={styles.itemContainer} wrap={false}>
      <View style={styles.itemRowHeader}>
        <Text style={styles.itemTitle}>
          <Text style={{ fontWeight: 'bold' }}>{title}</Text>
          {techString ? <Text style={styles.itemTechInline}> | <Text style={{ fontStyle: 'italic', fontWeight: 'normal' }}>{techString}</Text></Text> : null}
        </Text>
        <Text style={styles.itemDate}>{dateRange}</Text>
      </View>

      {projectUrl && cleanLink && !['github.com', 'portfolio.com'].includes(cleanLink) ? (
        <View style={{ marginBottom: 2 }}>
          <Link src={projectUrl.startsWith('http') ? projectUrl : `https://${projectUrl}`} style={styles.linkText}>
            {cleanLink}
          </Link>
        </View>
      ) : null}

      {bullets.length > 0 && (
        <View style={styles.bulletList}>
          {bullets.map((bullet: string, idx: number) => {
            const cleanBullet = bullet.replace(/^[•\-\*]\s*/, '')
            return (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.bulletSymbol}>•</Text>
                <Text style={styles.bulletContent}>{cleanBullet}</Text>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}
