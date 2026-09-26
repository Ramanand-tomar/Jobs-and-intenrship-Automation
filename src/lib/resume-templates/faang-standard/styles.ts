import { StyleSheet } from '@react-pdf/renderer'

export const styles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9.5,
    lineHeight: 1.35,
    color: '#1e293b',
    paddingTop: 36, // 0.5 inch standard margin
    paddingBottom: 36,
    paddingLeft: 36,
    paddingRight: 36,
    backgroundColor: '#ffffff'
  },
  // Header section
  headerContainer: {
    marginBottom: 8,
    alignItems: 'center',
    textAlign: 'center'
  },
  fullName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    letterSpacing: 0.5,
    marginBottom: 2,
    textTransform: 'uppercase'
  },
  headline: {
    fontSize: 9.5,
    color: '#475569',
    marginBottom: 3,
    fontWeight: 'medium'
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: 9,
    color: '#334155'
  },
  contactSeparator: {
    color: '#94a3b8',
    marginHorizontal: 5,
    fontSize: 8
  },
  linkText: {
    color: '#0369a1',
    textDecoration: 'none'
  },

  // Section Headers
  sectionHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0f172a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    borderBottomWidth: 0.75,
    borderBottomColor: '#0f172a',
    borderBottomStyle: 'solid',
    paddingBottom: 2,
    marginTop: 8,
    marginBottom: 4
  },

  // Summary
  summaryText: {
    fontSize: 9.25,
    color: '#334155',
    lineHeight: 1.4,
    marginBottom: 4
  },

  // Item headers (Experience, Projects, Education)
  itemContainer: {
    marginBottom: 5
  },
  itemRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 1
  },
  itemTitle: {
    fontSize: 9.5,
    color: '#0f172a',
    flex: 1
  },
  itemTechInline: {
    fontSize: 9,
    color: '#475569'
  },
  itemCompany: {
    fontSize: 9.5,
    fontWeight: 'bold',
    color: '#0f172a'
  },
  itemSubtitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2
  },
  itemRoleCompany: {
    fontSize: 9,
    color: '#334155',
    fontStyle: 'italic'
  },
  itemDate: {
    fontSize: 9,
    color: '#475569',
    textAlign: 'right',
    marginLeft: 8
  },
  itemLocation: {
    fontSize: 9,
    color: '#64748b',
    fontStyle: 'italic'
  },

  // Bullets
  bulletList: {
    marginTop: 1
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 1.5,
    paddingLeft: 4
  },
  bulletSymbol: {
    width: 8,
    fontSize: 8,
    color: '#334155'
  },
  bulletContent: {
    flex: 1,
    fontSize: 9,
    color: '#1e293b',
    lineHeight: 1.35
  },

  // Skills
  skillsSectionContainer: {
    marginBottom: 4
  },
  skillLine: {
    fontSize: 9,
    lineHeight: 1.4,
    marginBottom: 2
  },
  skillCategoryBold: {
    fontWeight: 'bold',
    color: '#0f172a'
  },
  skillCategoryValues: {
    color: '#1e293b'
  }
})
