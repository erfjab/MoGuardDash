import { toast } from 'vue-sonner'

const DUPLICATE_WINDOW_MS = 2000 // 2 seconds
const RATE_LIMIT_WINDOW = 1000 // 1 second
const MAX_TOASTS_PER_WINDOW = 3

interface RecentToast {
  key: string
  timestamp: number
}

const recentToasts: RecentToast[] = []
let toastCountInWindow = 0
let windowStart = Date.now()

function getMessageKey(message: string | any, data?: any): string {
  let key = typeof message === 'string' ? message : String(message)
  if (data && typeof data === 'object' && data.description) {
    key += '|' + data.description
  }
  return key
}

function isDuplicate(key: string): boolean {
  const now = Date.now()
  // Remove old entries
  const cutoff = now - DUPLICATE_WINDOW_MS
  // Filter in place or just find index
  // We can just clean up lazily
  
  // Check for duplicate in recent window
  return recentToasts.some(t => t.key === key && t.timestamp > cutoff)
}

function addToastRecord(key: string) {
  const now = Date.now()
  recentToasts.push({ key, timestamp: now })
  
  // Cleanup old toasts occasionally or just keep array small
  if (recentToasts.length > 50) {
    const cutoff = now - DUPLICATE_WINDOW_MS
    const index = recentToasts.findIndex(t => t.timestamp > cutoff)
    if (index > 0) {
      recentToasts.splice(0, index)
    } else if (index === -1) {
      // All are old
      recentToasts.length = 0
    }
  }
}

function checkRateLimit(): boolean {
  const now = Date.now()
  if (now - windowStart > RATE_LIMIT_WINDOW) {
    windowStart = now
    toastCountInWindow = 0
  }
  
  if (toastCountInWindow >= MAX_TOASTS_PER_WINDOW) {
    return false
  }
  
  toastCountInWindow++
  return true
}

function handleToast(type: 'success' | 'error' | 'info' | 'warning' | 'message', message: string | any, data?: any) {
  const key = getMessageKey(message, data)
  
  if (isDuplicate(key)) {
    console.log('Duplicate toast suppressed:', key)
    return
  }
  
  if (!checkRateLimit()) {
    console.log('Rate limit exceeded, toast suppressed:', key)
    return
  }
  
  addToastRecord(key)
  
  // @ts-ignore
  return toast[type](message, data)
}

export const smartToast = {
  ...toast,
  success: (message: string | any, data?: any) => handleToast('success', message, data),
  error: (message: string | any, data?: any) => handleToast('error', message, data),
  info: (message: string | any, data?: any) => handleToast('info', message, data),
  warning: (message: string | any, data?: any) => handleToast('warning', message, data),
  message: (message: string | any, data?: any) => handleToast('message', message, data),
}
