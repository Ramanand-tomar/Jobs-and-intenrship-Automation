/**
 * Form Validation Utility functions for JobBuddy.ai
 */

export const validateEmail = (email: string): boolean => {
  if (!email || !email.trim()) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

export const validatePhone = (phone: string): boolean => {
  if (!phone || !phone.trim()) return false
  // Accepts standard international formats: +1 (555) 000-0000, 123-456-7890, +919876543210
  return /^\+?[\d\s\-()]{7,20}$/.test(phone.trim())
}

export const validateURL = (url: string): boolean => {
  if (!url || !url.trim()) return true // Optional fields pass empty check
  try {
    const formatted = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`
    new URL(formatted)
    return true
  } catch {
    return false
  }
}

export const validateDateString = (date: string): boolean => {
  if (!date || !date.trim()) return true // Optional
  const trimmed = date.trim()
  if (/^present$/i.test(trimmed)) return true
  // Accepts YYYY, YYYY-MM, YYYY-MM-DD
  return /^\d{4}(-\d{2})?(-\d{2})?$/.test(trimmed)
}
