import { z } from 'zod'
import type { SubscriptionResponse } from '~/types/api'

export const subscriptionSchema = z.object({
  id: z.number(),
  username: z.string(),
  owner_username: z.string(),
  is_active: z.boolean(),
  enabled: z.boolean(),
  activated: z.boolean(),
  expired: z.boolean(),
  limited: z.boolean(),
  current_usage: z.number(),
  limit_usage: z.number(),
  limit_expire: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
})

export type Subscription = z.infer<typeof subscriptionSchema>

// Helper function to calculate left usage and expire
export function getSubscriptionMetrics(sub: SubscriptionResponse) {
  const now = Math.floor(Date.now() / 1000) // Current timestamp in seconds
  let timeElapsed = 0
  let timeLeftSeconds = 0
  let totalDays = 0

  if (sub.limit_expire === 0) {
    // Unlimited time
    timeElapsed = 0
    timeLeftSeconds = Infinity
    totalDays = 0
  } else if (sub.limit_expire > 0) {
    // Timestamp mode: limit_expire is a future timestamp
    const expiryTimestamp = sub.limit_expire
    const createdTimestamp = Math.floor(new Date(sub.created_at).getTime() / 1000)
    totalDays = Math.floor((expiryTimestamp - createdTimestamp) / 86400)
    timeElapsed = Math.floor((now - createdTimestamp) / 86400)
    timeLeftSeconds = Math.max(0, expiryTimestamp - now)
  } else {
    // Negative seconds mode: starts on first connect, convert to days
    totalDays = Math.floor(Math.abs(sub.limit_expire) / 86400)
    timeElapsed = 0
    timeLeftSeconds = Math.abs(sub.limit_expire)
  }

  const usageLeft = Math.max(0, sub.limit_usage - sub.current_usage)
  const usagePercent = sub.limit_usage > 0 ? (sub.current_usage / sub.limit_usage) * 100 : 0
  const timePercent = totalDays > 0 ? (timeElapsed / totalDays) * 100 : 0

  return {
    timeElapsed,
    timeLeftSeconds,
    totalDays,
    usageLeft,
    usagePercent,
    timePercent,
  }
}

// Format time to largest unit (i18n aware)
export function formatTimeLeft(seconds: number, t: (key: string) => string): string {
  if (seconds === Infinity) return t('subscriptions.unlimited')
  const absSeconds = Math.abs(seconds)
  const days = Math.floor(absSeconds / 86400)
  if (days > 0) return `${days} ${days === 1 ? t('subscriptions.day') : t('subscriptions.days')}`
  const hours = Math.floor(absSeconds / 3600)
  if (hours > 0) return `${hours} ${hours === 1 ? t('subscriptions.hour') : t('subscriptions.hours')}`
  const minutes = Math.floor(absSeconds / 60)
  if (minutes > 0) return `${minutes} ${minutes === 1 ? t('subscriptions.minute') : t('subscriptions.minutes')}`
  return `${absSeconds} ${absSeconds === 1 ? t('subscriptions.second') : t('subscriptions.seconds')}`
}
