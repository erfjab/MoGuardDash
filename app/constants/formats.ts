/**
 * Placeholder format tokens available for dynamic content
 * These can be used in: remark, address, uuid, access_title, access_description
 */
export const PLACEHOLDER_FORMATS = [
  { key: 'id', example: '42' },
  { key: 'username', example: 'john_doe' },
  { key: 'owner_username', example: 'admin' },
  { key: 'access_key', example: 'a1b2c3d4' },
  { key: 'enabled', example: '✅' },
  { key: 'activated', example: '✅' },
  { key: 'limited', example: '❌' },
  { key: 'expired', example: '❌' },
  { key: 'is_active', example: '✅' },
  { key: 'limit_usage', example: '10 GB' },
  { key: 'current_usage', example: '2.5 GB' },
  { key: 'left_usage', example: '7.5 GB' },
  { key: 'expire_date', example: '2025-12-31' },
  { key: 'expire_in', example: '30d 12h' },
  { key: 'expire_in_days', example: '30 days' },
] as const

export type PlaceholderFormat = typeof PLACEHOLDER_FORMATS[number]['key']
