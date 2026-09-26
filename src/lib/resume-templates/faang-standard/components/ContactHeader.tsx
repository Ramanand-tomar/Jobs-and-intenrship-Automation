import React from 'react'
import { Text, View, Link } from '@react-pdf/renderer'
import { styles } from '../styles'

export interface ContactHeaderProps {
  fullName: string
  headline?: string
  email: string
  phone?: string
  location?: string
  linkedinUrl?: string
  githubUrl?: string
  portfolioUrl?: string
}

function isValidUserUrl(url?: string): boolean {
  if (!url) return false
  const clean = url.trim().toLowerCase().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
  const genericDomains = ['linkedin.com', 'github.com', 'portfolio.com', 'website.com', 'example.com', 'leetcode.com']
  return clean.length > 0 && !genericDomains.includes(clean)
}

function formatDisplayUrl(url: string): string {
  return url.trim().replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')
}

export function ContactHeader({
  fullName,
  headline,
  email,
  phone,
  location,
  linkedinUrl,
  githubUrl,
  portfolioUrl
}: ContactHeaderProps) {
  const contactItems: Array<{ text: string; link?: string }> = []

  if (phone) contactItems.push({ text: phone })
  if (email) contactItems.push({ text: email, link: `mailto:${email}` })
  if (location) contactItems.push({ text: location })

  if (isValidUserUrl(linkedinUrl)) {
    const text = formatDisplayUrl(linkedinUrl!)
    const link = linkedinUrl!.startsWith('http') ? linkedinUrl! : `https://${linkedinUrl}`
    contactItems.push({ text, link })
  }

  if (isValidUserUrl(githubUrl)) {
    const text = formatDisplayUrl(githubUrl!)
    const link = githubUrl!.startsWith('http') ? githubUrl! : `https://${githubUrl}`
    contactItems.push({ text, link })
  }

  if (isValidUserUrl(portfolioUrl)) {
    const text = formatDisplayUrl(portfolioUrl!)
    const link = portfolioUrl!.startsWith('http') ? portfolioUrl! : `https://${portfolioUrl}`
    contactItems.push({ text, link })
  }

  return (
    <View style={styles.headerContainer}>
      <Text style={styles.fullName}>{fullName}</Text>
      {headline ? <Text style={styles.headline}>{headline}</Text> : null}

      <View style={styles.contactRow}>
        {contactItems.map((item, index) => (
          <React.Fragment key={index}>
            {index > 0 && <Text style={styles.contactSeparator}>|</Text>}
            {item.link ? (
              <Link src={item.link} style={styles.linkText}>
                {item.text}
              </Link>
            ) : (
              <Text>{item.text}</Text>
            )}
          </React.Fragment>
        ))}
      </View>
    </View>
  )
}
