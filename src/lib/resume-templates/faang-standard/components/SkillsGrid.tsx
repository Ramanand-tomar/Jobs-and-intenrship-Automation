import React from 'react'
import { Text, View } from '@react-pdf/renderer'
import { styles } from '../styles'

export interface SkillsGridProps {
  skillsCategorized?: Record<string, string[]> | null
  flatSkills?: string[] | null
}

export function SkillsGrid({ skillsCategorized, flatSkills }: SkillsGridProps) {
  // Filter out non-technical spoken languages from Technical Skills section
  const filteredCategorized = { ...skillsCategorized }
  if (filteredCategorized) {
    delete filteredCategorized["Languages (Spoken)"]
    delete filteredCategorized["Soft Skills"]
  }

  const entries = filteredCategorized ? Object.entries(filteredCategorized).filter(([_, list]) => list && list.length > 0) : []

  if (entries.length > 0) {
    return (
      <View wrap={false} style={styles.skillsSectionContainer}>
        {entries.map(([category, skills], idx) => (
          <Text key={idx} style={styles.skillLine}>
            <Text style={styles.skillCategoryBold}>{category}: </Text>
            <Text style={styles.skillCategoryValues}>{skills.join(', ')}</Text>
          </Text>
        ))}
      </View>
    )
  }

  if (flatSkills && flatSkills.length > 0) {
    return (
      <View wrap={false} style={styles.skillsSectionContainer}>
        <Text style={styles.skillLine}>
          <Text style={styles.skillCategoryBold}>Technical Skills: </Text>
          <Text style={styles.skillCategoryValues}>{flatSkills.join(', ')}</Text>
        </Text>
      </View>
    )
  }

  return null
}
