import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'
import { FaangResumeTemplate } from './resume-templates/faang-standard/template'

export interface ResumeData {
  fullName: string
  headline?: string
  email: string
  phone?: string
  location?: string
  linkedinUrl?: string
  githubUrl?: string
  portfolioUrl?: string
  leetcodeUrl?: string

  summary?: string

  skillsCategorized?: Record<string, string[]>
  skills?: string[]

  experience: Array<{
    title: string
    company: string
    roleType?: string
    employment_type?: string
    startDate?: string
    endDate?: string
    start?: string
    end?: string
    location?: string
    description?: string
    bullets?: string[]
    techUsed?: string[]
  }>

  projects?: Array<{
    title?: string
    name?: string
    subtitle?: string
    roleType?: string
    role?: string
    startDate?: string
    endDate?: string
    start_date?: string
    end_date?: string
    description?: string
    bullets?: string[]
    tech?: string[]
    techUsed?: string[]
    technologies?: string[]
    githubUrl?: string
    liveUrl?: string
    link?: string
    url?: string
  }>

  education: Array<{
    degree?: string
    institution?: string
    school?: string
    year?: string
    graduation?: string
    fieldOfStudy?: string
    field?: string
    field_of_study?: string
    cgpaMarks?: string
  }>

  certifications?: string[]
  awards?: any[]
  publications?: any[]
}

export async function generateATSResumePDF(data: ResumeData): Promise<Buffer> {
  // Normalize experience array for template
  const normalizedExperience = (data.experience || []).map(exp => ({
    title: exp.title,
    company: exp.company,
    start: exp.startDate || exp.start || '',
    end: exp.endDate || exp.end || 'Present',
    location: exp.location,
    employment_type: exp.employment_type || exp.roleType,
    details: exp.description,
    bullets: exp.bullets || (exp.description ? [exp.description] : [])
  }))

  // Normalize projects array for template
  const normalizedProjects = (data.projects || []).map(proj => ({
    title: proj.title || proj.name || 'Project',
    role: proj.role || proj.roleType,
    tech: proj.tech || proj.techUsed || proj.technologies || [],
    description: proj.description || (proj.bullets ? proj.bullets.join('; ') : ''),
    bullets: proj.bullets || (proj.description ? [proj.description] : []),
    link: proj.liveUrl || proj.githubUrl || proj.link || proj.url,
    start_date: proj.startDate || proj.start_date,
    end_date: proj.endDate || proj.end_date
  }))

  // Normalize education array
  const normalizedEducation = (data.education || []).map(edu => ({
    degree: edu.degree || 'Degree',
    institution: edu.institution || edu.school || 'University',
    school: edu.school || edu.institution,
    field: edu.fieldOfStudy || edu.field || edu.field_of_study,
    graduation: edu.year || edu.graduation
  }))

  const docElement = FaangResumeTemplate({
    data: {
      fullName: data.fullName,
      headline: data.headline,
      email: data.email,
      phone: data.phone,
      location: data.location,
      linkedinUrl: data.linkedinUrl,
      githubUrl: data.githubUrl,
      portfolioUrl: data.portfolioUrl,
      summary: data.summary,
      skillsCategorized: data.skillsCategorized,
      flatSkills: data.skills,
      experience: normalizedExperience,
      projects: normalizedProjects as any,
      education: normalizedEducation,
      certifications: data.certifications,
      awards: data.awards,
      publications: data.publications
    }
  })

  const buffer = await renderToBuffer(docElement)
  return Buffer.from(buffer)
}
