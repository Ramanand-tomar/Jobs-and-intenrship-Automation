import React from 'react'
import { Document, Page, Text, View } from '@react-pdf/renderer'
import { styles } from './styles'
import { ContactHeader } from './components/ContactHeader'
import { ExperienceItem } from './components/ExperienceItem'
import { ProjectItem } from './components/ProjectItem'
import { SkillsGrid } from './components/SkillsGrid'
import { CandidateProfile, ExperienceEntry, ProjectEntry, EducationEntry } from '@/types'

export interface FaangResumeData extends Partial<CandidateProfile> {
  fullName: string
  headline?: string
  email: string
  phone?: string
  location?: string
  linkedinUrl?: string
  githubUrl?: string
  portfolioUrl?: string
  summary?: string
  skillsCategorized?: Record<string, string[]>
  flatSkills?: string[]
  experience?: ExperienceEntry[]
  projects?: ProjectEntry[]
  education?: EducationEntry[] | any
  certifications?: string[]
  awards?: any[]
  publications?: any[]
}

export function FaangResumeTemplate({ data }: { data: FaangResumeData }) {
  const experiences = data.experience || []
  const projects = data.projects || []
  const educationList = Array.isArray(data.education) ? data.education : []

  return (
    <Document title={`${data.fullName} - Resume`}>
      <Page size="LETTER" style={styles.page}>
        {/* Contact Header */}
        <ContactHeader
          fullName={data.fullName}
          headline={data.headline}
          email={data.email}
          phone={data.phone}
          location={data.location}
          linkedinUrl={data.linkedinUrl}
          githubUrl={data.githubUrl}
          portfolioUrl={data.portfolioUrl}
        />

        {/* Summary */}
        {data.summary ? (
          <View wrap={false}>
            <Text style={styles.sectionHeader}>Professional Summary</Text>
            <Text style={styles.summaryText}>{data.summary}</Text>
          </View>
        ) : null}

        {/* Work Experience */}
        {experiences.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Work Experience</Text>
            {experiences.map((exp, idx) => (
              <ExperienceItem key={idx} item={exp} />
            ))}
          </View>
        )}

        {/* Key Projects */}
        {projects.length > 0 && (
          <View>
            <Text style={styles.sectionHeader}>Key Projects</Text>
            {projects.map((proj, idx) => (
              <ProjectItem key={idx} item={proj} />
            ))}
          </View>
        )}

        {/* Technical Skills */}
        {((data.skillsCategorized && Object.keys(data.skillsCategorized).length > 0) || (data.flatSkills && data.flatSkills.length > 0) || (data.skills && data.skills.length > 0)) && (
          <View wrap={false}>
            <Text style={styles.sectionHeader}>Technical Skills</Text>
            <SkillsGrid
              skillsCategorized={data.skillsCategorized}
              flatSkills={data.flatSkills || data.skills || []}
            />
          </View>
        )}

        {/* Education */}
        {educationList.length > 0 && (
          <View wrap={false}>
            <Text style={styles.sectionHeader}>Education</Text>
            {educationList.map((edu: any, idx: number) => {
              const degreeField = [edu.degree, edu.field || edu.field_of_study].filter(Boolean).join(' in ')
              const school = edu.school || edu.institution || 'University'
              const year = edu.graduation || edu.year || ''

              return (
                <View key={idx} style={styles.itemContainer} wrap={false}>
                  <View style={styles.itemRowHeader}>
                    <Text style={styles.itemCompany}>{school}</Text>
                    <Text style={styles.itemDate}>{year}</Text>
                  </View>
                  <Text style={styles.itemSubtitleRow}>
                    <Text style={styles.itemRoleCompany}>{degreeField}</Text>
                  </Text>
                </View>
              )
            })}
          </View>
        )}

        {/* Certifications & Awards */}
        {((data.certifications && data.certifications.length > 0) || (data.awards && data.awards.length > 0)) && (
          <View wrap={false}>
            <Text style={styles.sectionHeader}>Certifications & Awards</Text>
            {data.certifications?.map((cert, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.bulletSymbol}>•</Text>
                <Text style={styles.bulletContent}>{cert}</Text>
              </View>
            ))}
            {data.awards?.map((award: any, idx: number) => (
              <View key={idx} style={styles.bulletRow}>
                <Text style={styles.bulletSymbol}>•</Text>
                <Text style={styles.bulletContent}>
                  <Text style={{ fontWeight: 'bold' }}>{typeof award === 'object' ? award.title || award.name || '' : award}</Text>
                  {typeof award === 'object' && award.issuer ? ` — ${award.issuer}` : ''}
                  {typeof award === 'object' && award.date ? ` (${award.date})` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
      </Page>
    </Document>
  )
}
