// GuardCore API Types
// Auto-generated from OpenAPI 3.1.0 specification

export type AdminRole = 'owner' | 'seller' | 'reseller'
export type AdminPlaceHolderCategory = 'info' | 'limited' | 'expired' | 'disabled'
export type NodeCategory = 'marzban' | 'marzneshin' | 'rustneshin'

// Base Schemas
export interface AdminPlaceHolder {
  remark: string
  uuid: string
  address: string
  port: number
  categories: AdminPlaceHolderCategory[]
}

export interface AdminCreate {
  username: string
  password: string
  role: AdminRole
  service_ids: number[]
  create_access?: boolean | null
  update_access?: boolean | null
  remove_access?: boolean | null
  count_limit?: number | null
  usage_limit?: number | null
  access_prefix?: string | null
  placeholders?: AdminPlaceHolder[] | null
  max_links?: number | null
  shuffle_links?: boolean | null
  access_title?: string | null
  access_description?: string | null
  telegram_id?: string | null
  telegram_token?: string | null
  telegram_logger_id?: string | null
  telegram_topic_id?: string | null
  telegram_status?: boolean | null
  telegram_send_subscriptions?: boolean | null
  discord_webhook_status?: boolean | null
  discord_webhook_url?: string | null
  discord_send_subscriptions?: boolean | null
  expire_warning_days?: number | null
  usage_warning_percent?: number | null
  username_tag?: boolean | null
  support_url?: string | null
  update_interval?: number | null
  announce?: string | null
  announce_url?: string | null
}

export interface AdminCurrentUpdate {
  password?: string | null
  placeholders?: AdminPlaceHolder[] | null
  max_links?: number | null
  shuffle_links?: boolean | null
  access_title?: string | null
  access_description?: string | null
  telegram_id?: string | null
  telegram_token?: string | null
  telegram_topic_id?: string | null
  telegram_status?: boolean | null
  telegram_send_subscriptions?: boolean | null
  telegram_logger_id?: string | null
  discord_webhook_status?: boolean | null
  discord_webhook_url?: string | null
  discord_send_subscriptions?: boolean | null
  expire_warning_days?: number | null
  usage_warning_percent?: number | null
  username_tag?: boolean | null
  support_url?: string | null
  update_interval?: number | null
  announce?: string | null
  announce_url?: string | null
}

export interface AdminResponse {
  id: number
  enabled: boolean
  username: string
  role: AdminRole
  service_ids: number[]
  create_access: boolean | null
  update_access: boolean | null
  remove_access: boolean | null
  count_limit: number | null
  current_count: number | null
  left_count: number | null
  reached_count_limit: boolean | null
  usage_limit: number | null
  current_usage: number | null
  left_usage: number | null
  reached_usage_limit: boolean | null
  placeholders: AdminPlaceHolder[] | null
  max_links: number | null
  shuffle_links: boolean | null
  api_key: string
  access_title: string | null
  access_prefix: string | null
  access_description: string | null
  telegram_id: string | null
  telegram_token: string | null
  telegram_logger_id: string | null
  telegram_topic_id: string | null
  telegram_status: boolean | null
  telegram_send_subscriptions: boolean | null
  totp_enabled: boolean
  totp_status?: boolean
  discord_webhook_status: boolean | null
  discord_webhook_url: string | null
  discord_send_subscriptions: boolean | null
  expire_warning_days: number | null
  usage_warning_percent: number | null
  username_tag: boolean | null
  support_url: string | null
  update_interval: number | null
  announce: string | null
  announce_url: string | null
  last_login_at: string | null
  last_online_at: string | null
  last_backup_at: string | null
  created_at: string
  updated_at: string
}

export interface AdminToken {
  access_token: string
  token_type: string
}

export interface TotpProvisioningResponse {
  secret?: string | null
  provisioning_uri?: string | null
  expires_at?: string | null
}

export interface AdminUpdate {
  password?: string | null
  create_access?: boolean | null
  update_access?: boolean | null
  remove_access?: boolean | null
  count_limit?: number | null
  usage_limit?: number | null
  service_ids?: number[] | null
  placeholders?: AdminPlaceHolder[] | null
  max_links?: number | null
  shuffle_links?: boolean | null
  access_prefix?: string | null
  access_title?: string | null
  access_description?: string | null
  telegram_id?: string | null
  telegram_token?: string | null
  telegram_topic_id?: string | null
  telegram_logger_id?: string | null
  telegram_status?: boolean | null
  telegram_send_subscriptions?: boolean | null
  discord_webhook_status?: boolean | null
  discord_webhook_url?: string | null
  discord_send_subscriptions?: boolean | null
  expire_warning_days?: number | null
  usage_warning_percent?: number | null
  announce?: string | null
  announce_url?: string | null
  username_tag?: boolean | null
  support_url?: string | null
  update_interval?: number | null
}

export interface AdminUsageLog {
  usage: number
  created_at: string
}

export interface AdminUsageLogsResponse {
  admin: AdminResponse
  usages: AdminUsageLog[]
}

export interface NodeCreate {
  remark: string
  category: NodeCategory
  username: string
  password: string
  host: string
  offset_link?: number
  batch_size?: number
  priority?: number
  usage_rate?: number
  script_url?: string | null
  script_secret?: string | null
}

export interface NodeResponse {
  id: number
  enabled: boolean
  remark: string
  category: NodeCategory
  username: string
  password: string
  host: string
  current_usage: number
  last_used_at: string | null
  usage_rate: number | null
  offset_link: number
  batch_size: number
  priority: number
  script_url: string | null
  script_secret: string | null
  created_at: string
  updated_at: string
}

export interface NodeStatsResponse {
  total_nodes: number
  active_nodes: number
  inactive_nodes: number
}

export interface NodeUpdate {
  remark?: string | null
  username?: string | null
  password?: string | null
  host?: string | null
  offset_link?: number | null
  batch_size?: number | null
  priority?: number | null
  usage_rate?: number | null
  script_url?: string | null
  script_secret?: string | null
}

export interface ServiceCreate {
  remark: string
  node_ids: number[]
}

export interface ServiceResponse {
  id: number
  remark: string
  node_ids: number[]
  users_count?: number | null
}

export interface ServiceUpdate {
  remark?: string | null
  node_ids?: number[] | null
}

// Auto Renewal Schemas
export interface AutoRenewalCreate {
  limit_expire: number
  limit_usage: number
  reset_usage?: boolean
}

export interface AutoRenewalResponse {
  id: number
  limit_expire: number | null
  limit_usage: number | null
  reset_usage: boolean
}

export interface AutoRenewalUpdate {
  id: number
  limit_expire?: number | null
  limit_usage?: number | null
  reset_usage?: boolean | null
}

export interface SubscriptionCreate {
  username: string
  limit_usage: number
  limit_expire: number
  service_ids: number[]
  access_key?: string | null
  note?: string | null
  telegram_id?: string | null
  discord_webhook_url?: string | null
  auto_delete_days?: number | null
  auto_renewals?: AutoRenewalCreate[] | null
}

export interface SubscriptionResponse {
  id: number
  username: string
  owner_username: string
  access_key: string
  enabled: boolean
  activated: boolean
  reached: boolean
  limited: boolean
  expired: boolean
  is_active: boolean
  is_online: boolean
  link: string
  limit_usage: number
  reset_usage: number
  total_usage: number
  current_usage: number
  limit_expire: number
  auto_delete_days: number
  service_ids: number[]
  note: string | null
  telegram_id: string | null
  discord_webhook_url: string | null
  online_at: string | null
  last_reset_at: string | null
  last_revoke_at: string | null
  last_request_at: string | null
  last_client_agent: string | null
  created_at: string
  updated_at: string
  auto_renewals: AutoRenewalResponse[]
}

export interface SubscriptionStatsResponse {
  total: number
  active: number
  inactive: number
  disabled: number
  expired: number
  limited: number
  has_revoked: number
  has_reseted: number
  total_removed: number
  total_usage: number
}

export interface SubscriptionStatusStatsResponse {
  total: number
  active: number
  disabled: number
  expired: number
  limited: number
  pending: number
  available: number
  unavailable: number
  online: number
  offline: number
  total_usage: number
  last_24h_online: number
  last_24h_usage: number
}

export interface SubscriptionUpdate {
  username?: string | null
  limit_usage?: number | null
  limit_expire?: number | null
  service_ids?: number[] | null
  note?: string | null
  telegram_id?: string | null
  discord_webhook_url?: string | null
  auto_delete_days?: number | null
  auto_renewals?: AutoRenewalUpdate[] | null
}

export interface SubscriptionFilters {
  limited?: boolean
  expired?: boolean
  is_active?: boolean
  enabled?: boolean
  online?: boolean
  order_by?: string
  page?: number
  size?: number
}

export interface SubscriptionCountFilters {
  limited?: boolean
  expired?: boolean
  is_active?: boolean
  enabled?: boolean
  online?: boolean
}

export interface SubscriptionUsageLog {
  usage: number
  created_at: string
}

export interface SubscriptionUsageLogsResponse {
  subscription: SubscriptionResponse
  usages: SubscriptionUsageLog[]
}

export interface UsageSubscriptionDetail {
  username: string
  usage: number
  is_active: boolean
}

export interface MostUsageSubscription {
  subscriptions: UsageSubscriptionDetail[]
  start_date: string
  end_date: string
}

export interface UsageDetailStats {
  start?: string | null
  end?: string | null
  remark?: string | null
  step?: number | null
  usage: number
}

export interface CountDetailStats {
  start?: string | null
  end?: string | null
  count: number
}

export interface TopSubDetailStats {
  username: string
  is_active: boolean
  usage: number
}

export interface ExpireSubDetailStats {
  username: string
  is_active: boolean
  expire: number
}

export interface StatsResponse {
  total_subscriptions: number
  active_subscriptions: number
  inactive_subscriptions: number
  online_subscriptions: number
  most_usage_subscription?: string | null
  most_usage_subscriptions: UsageDetailStats[]
  total_admins: number
  active_admins: number
  inactive_admins: number
  most_usage_admins: UsageDetailStats[]
  total_nodes: number
  active_nodes: number
  inactive_nodes: number
  most_usage_nodes: UsageDetailStats[]
  total_lifetime_usages: number
  total_day_usages: number
  total_week_usages: number
  last_24h_usages: UsageDetailStats[]
  last_7d_usages: UsageDetailStats[]
}

export interface AdminStatsResponseNew {
  usage_limit: number | null
  current_usage: number
  left_usage: number | null
  lifetime_usage: number
  current_day_usage: number
  current_week_usage: number
  yesterday_usage: number
  last_week_usage: number
  last_24h_usages: UsageDetailStats[]
  last_7d_usages: UsageDetailStats[]
  last_1m_usages: UsageDetailStats[]
  last_3m_usages: UsageDetailStats[]
  last_1y_usages: UsageDetailStats[]
  today_top_10_usage_subscriptions: TopSubDetailStats[]
  week_top_10_usage_subscriptions: TopSubDetailStats[]
  month_top_10_usage_subscriptions: TopSubDetailStats[]
  last_24h_counts: CountDetailStats[]
  last_7d_counts: CountDetailStats[]
  last_1m_counts: CountDetailStats[]
  last_3m_counts: CountDetailStats[]
  last_1y_counts: CountDetailStats[]
  limit_count: number
  current_count: number
  left_count: number
  total_subscriptions: number
  active_subscriptions: number
  inactive_subscriptions: number
  disabled_subscriptions: number
  expired_subscriptions: number
  limited_subscriptions: number
  today_new_subscriptions: number
  yesterday_new_subscriptions: number
  today_requested_subscriptions: number
  today_revoked_subscriptions: number
  today_reseted_subscriptions: number
  today_expire_soon_subscriptions: ExpireSubDetailStats[]
  week_expire_soon_subscriptions: ExpireSubDetailStats[]
  today_removed_subscriptions: number
  yesterday_removed_subscriptions: number
  total_removed_subscriptions: number
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface ValidationError {
  loc: (string | number)[]
  msg: string
  type: string
}

export interface HTTPValidationError {
  detail: ValidationError[]
}

export interface AgentStatsDetail {
  category: string
  count: number
}

export interface AgentStatsResponse {
  agents: AgentStatsDetail[]
}

export interface LastReachedSubscriptionDetail {
  username: string
  reached_at: string
  limited: boolean
  expired: boolean
}

// API Error Interface
export interface ApiError {
  status: number
  statusText: string
  endpoint: string
  method: string
  message: string
  detail?: any
  timestamp: string
}