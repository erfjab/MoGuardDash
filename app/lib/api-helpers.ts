// API Helper Utilities

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Format date to locale string
 */
export function formatDate(date: string | null, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return 'N/A'
  
  return new Date(date).toLocaleString(undefined, options || {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format relative time (e.g., "2 hours ago")
 * Note: For i18n support in components, use useFormatTime composable instead
 */
export function formatRelativeTime(date: string | null): string {
  if (!date) return 'Never'

  const now = new Date()
  const past = new Date(date)
  const diffMs = now.getTime() - past.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'Just now'
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`
  if (diffDay < 30) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`

  return formatDate(date)
}

/**
 * Convert GB to bytes
 */
export function gbToBytes(gb: number): number {
  return gb * 1024 * 1024 * 1024
}

/**
 * Convert bytes to GB
 */
export function bytesToGb(bytes: number): number {
  return bytes / 1024 / 1024 / 1024
}

/**
 * Calculate percentage
 */
export function calculatePercentage(current: number, total: number): number {
  if (total === 0) return 0
  return Math.round((current / total) * 100)
}

/**
 * Convert Unix timestamp to Date
 */
export function unixToDate(unix: number): Date {
  return new Date(unix * 1000)
}

/**
 * Convert Date to Unix timestamp
 */
export function dateToUnix(date: Date): number {
  return Math.floor(date.getTime() / 1000)
}

/**
 * Add days to current date and return Unix timestamp
 */
export function addDaysToNow(days: number): number {
  const now = new Date()
  now.setDate(now.getDate() + days)
  return dateToUnix(now)
}

/**
 * Check if date is expired
 */
export function isExpired(expiryUnix: number): boolean {
  const now = Math.floor(Date.now() / 1000)
  return now > expiryUnix
}

/**
 * Get remaining days
 */
export function getRemainingDays(expiryUnix: number): number {
  const now = Math.floor(Date.now() / 1000)
  const diff = expiryUnix - now
  return Math.floor(diff / 86400) // 86400 seconds in a day
}

/**
 * Format expiry time
 * Note: For i18n support in components, use useFormatTime composable instead
 */
export function formatExpiry(expiryUnix: number): string {
  if (isExpired(expiryUnix)) {
    return 'Expired'
  }

  const days = getRemainingDays(expiryUnix)
  
  if (days < 1) return 'Less than 1 day'
  if (days === 1) return '1 day left'
  if (days < 30) return `${days} days left`
  
  const months = Math.floor(days / 30)
  if (months === 1) return '1 month left'
  if (months < 12) return `${months} months left`
  
  const years = Math.floor(months / 12)
  return `${years} year${years > 1 ? 's' : ''} left`
}

/**
 * Get status badge variant based on status
 */
export function getStatusVariant(isActive: boolean): 'default' | 'secondary' | 'destructive' | 'outline' {
  return isActive ? 'default' : 'secondary'
}

/**
 * Get usage percentage variant
 */
export function getUsageVariant(percentage: number): 'default' | 'secondary' | 'destructive' {
  if (percentage >= 90) return 'destructive'
  if (percentage >= 70) return 'secondary'
  return 'default'
}

/**
 * Validate username format
 */
export function isValidUsername(username: string): boolean {
  return /^[a-zA-Z0-9_-]{3,32}$/.test(username)
}

/**
 * Validate password strength
 */
export function isStrongPassword(password: string): boolean {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)
}

/**
 * Generate random password
 */
export function generatePassword(length = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Debug: Check if text is already truncated
  // console.log('Copying to clipboard:', text)

  // Prefer modern async clipboard API when available and permitted
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('navigator.clipboard.writeText failed, falling back:', err)
  }

  // Fallback: use a hidden textarea + execCommand('copy')
  try {
    if (typeof document === 'undefined') return false
    const textarea = document.createElement('textarea')
    textarea.value = text
    
    // Ensure element is not visible but part of DOM
    // We use fixed position off-screen instead of 1px size to avoid selection issues
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    textarea.style.top = '0'
    textarea.setAttribute('readonly', '') // Prevent keyboard on mobile
    
    document.body.appendChild(textarea)
    
    textarea.select()
    textarea.setSelectionRange(0, 99999) // For mobile devices
    
    const success = document.execCommand('copy')
    document.body.removeChild(textarea)
    return success
  } catch (fallbackErr) {
    // eslint-disable-next-line no-console
    console.error('Fallback copy failed:', fallbackErr)
    return false
  }
}

/**
 * Download text as file
 */
export function downloadTextFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Build a subscription link from the API response with robust fallbacks
 */
export function buildSubscriptionLink(
  sub: import('~/types/api').SubscriptionResponse,
  origin?: string
): { link: string; source: 'provided' | 'computed'; debug: Record<string, any> } {
  const dbg: Record<string, any> = {
    username: sub?.username,
    hasLinkField: Boolean(sub?.link),
    access_key: sub?.access_key,
    enabled: sub?.enabled,
    is_active: sub?.is_active,
    expired: sub?.expired,
    limited: sub?.limited,
  }

  // Use provided link if it's non-empty
  const provided = (sub?.link || '').trim()
  if (provided) {
    return { link: provided, source: 'provided', debug: { ...dbg, used: 'provided' } }
  }

  // Fallback: construct from access_key if available
  const base = origin || (typeof window !== 'undefined' ? window.location.origin : '')
  const key = (sub?.access_key || '').trim()
  if (base && key) {
    // Based on guards endpoints in api.ts: /guards/{secret}
    const computed = `${base}/guards/${encodeURIComponent(key)}`
    return { link: computed, source: 'computed', debug: { ...dbg, base, used: 'computed' } }
  }

  // Last resort: empty link
  return { link: '', source: 'computed', debug: { ...dbg, base, used: 'empty' } }
}

/**
 * Copy subscription link with verbose logging to console
 */
export async function copySubscriptionLink(
  sub: import('~/types/api').SubscriptionResponse
): Promise<{ ok: boolean; link: string; reason?: 'no-link' | 'copy-failed'; source?: 'provided' | 'computed' }> {
  const built = buildSubscriptionLink(sub)

  if (!built.link) {
    return { ok: false, link: '', reason: 'no-link', source: built.source }
  }

  const ok = await copyToClipboard(built.link)
  if (!ok) return { ok: false, link: built.link, reason: 'copy-failed', source: built.source }
  return { ok: true, link: built.link, source: built.source }
}

/**
 * Format role display name
 */
export function formatRole(role: 'owner' | 'seller' | 'reseller'): string {
  const roleMap = {
    owner: 'Owner',
    seller: 'Seller',
    reseller: 'Reseller',
  }
  return roleMap[role]
}

/**
 * Format category display name
 */
export function formatCategory(category: 'marzban' | 'marzneshin' | 'rustneshin'): string {
  const categoryMap = {
    marzban: 'Marzban',
    marzneshin: 'Marzneshin',
    rustneshin: 'Rustneshin',
  }
  return categoryMap[category]
}

/**
 * Parse validation errors from API
 */
export function parseValidationErrors(detail: any[]): string[] {
  if (!Array.isArray(detail)) return []
  
  return detail.map((error: any) => {
    const field = error.loc?.slice(-1)[0] || 'field'
    return `${field}: ${error.msg}`
  })
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Format date/time smartly based on period
 */
export function formatDateTimeSmart(dateStr: string | null | undefined, period: string = '24h'): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  
  // برای 24 ساعت: فقط ساعت
  if (period === '24h') {
    return date.toLocaleString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  // برای 7 روز: روز و ساعت
  if (period === '7d') {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit'
    })
  }
  
  // برای 1 ماه و بیشتر: فقط تاریخ
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Create QR code URL for a given link
 */
export function createQrCodeUrl(link: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(link)}&margin=20`
}
