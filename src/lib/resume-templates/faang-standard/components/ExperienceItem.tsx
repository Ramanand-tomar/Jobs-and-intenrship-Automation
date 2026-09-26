import React from 'react'
import { Text, View } from '@react-pdf/renderer'
import { styles } from '../styles'
import { ExperienceEntry } from '@/types'

export interface ExperienceItemProps {
  item: ExperienceEntry
}

export function ExperienceItem({ item }: ExperienceItemProps) {
  const dateRange = [item.start, item.end || 'Present'].filter(Boolean).join(' - ')
  const bullets = item.bullets && item.bullets.length > 0
    ? item.bullets
    : item.details
      ? item.details.split('\n').filter(b => b.trim().length > 0)
      : []

  return (
    <View style={styles.itemContainer} wrap={false}>
      <View style={styles.itemRowHeader}>
        <Text style={styles.itemCompany}>
          {item.company}
          {item.location ? <Text style={styles.itemLocation}> — {item.location}</Text> : null}
        </Text>
        <Text style={styles.itemDate}>{dateRange}</Text>
      </View>

      <View style={styles.itemSubtitleRow}>
        <Text style={styles.itemTitle}>
          {item.title}
          {item.employment_type ? ` (${item.employment_type})` : ''}
        </Text>
      </View>

      {bullets.length > 0 && (
        <View style={styles.bulletList}>
          {bullets.map((bullet, idx) => {
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
