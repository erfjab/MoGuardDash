/**
 * GuardCore API - Main Export
 * 
 * This file exports all API-related functionality for easy imports
 */

// Types
export type * from '~/types/api'

// Core API
export { ApiClient } from './api-client'
export { GuardCoreApi } from './api'

// Helpers - export specific functions to avoid duplicates
export {
  formatDate,
  formatRelativeTime,
  gbToBytes,
  bytesToGb,
  calculatePercentage,
  unixToDate,
  dateToUnix,
  addDaysToNow,
  isExpired,
  getRemainingDays,
  formatExpiry,
  getStatusVariant,
  getUsageVariant,
  isValidUsername,
  isStrongPassword,
  generatePassword,
  copyToClipboard,
  downloadTextFile,
  buildSubscriptionLink,
  copySubscriptionLink,
  formatRole,
  formatCategory,
  parseValidationErrors,
  debounce,
  throttle,
  formatDateTimeSmart,
  createQrCodeUrl,
} from './api-helpers'
