/**
 * Composable for formatting time-related strings with i18n support
 */
export function useFormatTime() {
  const { t } = useI18n()

  /**
   * Format expiry time with i18n support
   */
  function formatExpiry(expiryUnix: number): string {
    const now = Math.floor(Date.now() / 1000)
    if (now > expiryUnix) {
      return t('time.expired')
    }

    const diff = expiryUnix - now
    const days = Math.floor(diff / 86400) // 86400 seconds in a day
    
    if (days < 1) return t('time.lessThanOneDay')
    if (days === 1) return t('time.oneDayLeft')
    if (days < 30) return t('time.daysLeft', { count: days })
    
    const months = Math.floor(days / 30)
    if (months === 1) return t('time.oneMonthLeft')
    if (months < 12) return t('time.monthsLeft', { count: months })
    
    const years = Math.floor(months / 12)
    if (years === 1) return t('time.oneYearLeft')
    return t('time.yearsLeft', { count: years })
  }

  /**
   * Format date to relative time (e.g., "1 day ago", "3 days ago")
   */
  function formatDateAgo(dateString?: string | null): string {
    if (!dateString) return 'Never'
    
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / 86400000)
    
    if (diffDays === 0) return t('time.today')
    if (diffDays === 1) return t('time.oneDayAgo')
    return t('time.daysAgo', { count: diffDays })
  }

  return {
    formatExpiry,
    formatDateAgo,
  }
}
