import { ApiClient } from '~/lib/api-client'
import type {
  AdminCreate,
  AdminCurrentUpdate,
  AdminResponse,
  AdminStatsResponseNew,
  AdminToken,
  AdminUpdate,
  AdminUsageLogsResponse,
  LoginCredentials,
  MostUsageSubscription,
  NodeCreate,
  NodeResponse,
  NodeStatsResponse,
  NodeUpdate,
  ServiceCreate,
  ServiceResponse,
  ServiceUpdate,
  StatsResponse,
  SubscriptionCreate,
  SubscriptionResponse,
  SubscriptionStatsResponse,
  SubscriptionUpdate,
  SubscriptionUsageLogsResponse,
  SubscriptionFilters,
  SubscriptionCountFilters,
  AgentStatsResponse,
  LastReachedSubscriptionDetail,
  TotpProvisioningResponse,
} from '~/types/api'

export class GuardCoreApi {
  constructor(private client: ApiClient) {}

  // ==================== Base ====================
  async checkHealth() {
    return this.client.get('/')
  }

  // ==================== Guards ====================
  guards = {
    getSubscription: (secret: string) => {
      return this.client.get(`/guards/${secret}`)
    },

    getSubscriptionInfo: (secret: string) => {
      return this.client.get<SubscriptionResponse>(`/guards/${secret}/info`)
    },

    getSubscriptionUsages: (secret: string) => {
      return this.client.get<SubscriptionUsageLogsResponse>(
        `/guards/${secret}/usages`
      )
    },
  }

  // ==================== Stats ====================
  stats = {
    getStats: () => {
      return this.client.get<StatsResponse>('/api/stats')
    },

    getMostUsageSubscriptions: (params: { start_date: string; end_date: string }) => {
      return this.client.get<MostUsageSubscription>(
        '/api/stats/subscriptions/most_usage',
        params
      )
    },

    getUsageStats: (params: { start_date: string; end_date: string }) => {
      return this.client.get<UsageStatsResponse>('/api/stats/usage', params)
    },

    getAgentStats: () => {
      return this.client.get<AgentStatsResponse>('/api/stats/agents')
    },

    getLastReachedSubscriptions: (params?: {
      page?: number
      size?: number
      start_date?: string
      end_date?: string
    }) => {
      return this.client.get<LastReachedSubscriptionDetail[]>(
        '/api/stats/subscriptions/reacheds',
        params
      )
    },
  }

  // ==================== Nodes ====================
  nodes = {
    getAll: () => {
      return this.client.get<NodeResponse[]>('/api/nodes')
    },

    getById: (nodeId: number) => {
      return this.client.get<NodeResponse>(`/api/nodes/${nodeId}`)
    },

    create: (data: NodeCreate) => {
      return this.client.post<NodeResponse>('/api/nodes', data)
    },

    update: (nodeId: number, data: NodeUpdate) => {
      return this.client.put<NodeResponse>(`/api/nodes/${nodeId}`, data)
    },

    delete: (nodeId: number) => {
      return this.client.delete<Record<string, any>>(`/api/nodes/${nodeId}`)
    },

    enable: (nodeId: number) => {
      return this.client.post<NodeResponse>(`/api/nodes/${nodeId}/enable`)
    },

    disable: (nodeId: number) => {
      return this.client.post<NodeResponse>(`/api/nodes/${nodeId}/disable`)
    },

    getStats: () => {
      return this.client.get<NodeStatsResponse>('/api/nodes/stats')
    },
  }

  // ==================== Services ====================
  services = {
    getAll: () => {
      return this.client.get<ServiceResponse[]>('/api/services')
    },

    getById: (serviceId: number) => {
      return this.client.get<ServiceResponse>(`/api/services/${serviceId}`)
    },

    create: (data: ServiceCreate) => {
      return this.client.post<ServiceResponse>('/api/services', data)
    },

    update: (serviceId: number, data: ServiceUpdate) => {
      return this.client.put<ServiceResponse>(
        `/api/services/${serviceId}`,
        data
      )
    },

    delete: (serviceId: number) => {
      return this.client.delete<Record<string, any>>(
        `/api/services/${serviceId}`
      )
    },
  }

  // ==================== Admins ====================
  admins = {
    login: (credentials: LoginCredentials, totpCode?: string) => {
      const url = totpCode ? `/api/admins/token?totp_code=${totpCode}` : '/api/admins/token'
      return this.client.postForm<AdminToken>(url, {
        username: credentials.username,
        password: credentials.password,
        grant_type: 'password',
      })
    },

    getAll: () => {
      return this.client.get<AdminResponse[]>('/api/admins')
    },

    getByUsername: (username: string) => {
      return this.client.get<AdminResponse>(`/api/admins/${username}`)
    },

    getCurrent: () => {
      return this.client.get<AdminResponse>('/api/admins/current')
    },

    create: (data: AdminCreate) => {
      return this.client.post<AdminResponse>('/api/admins', data)
    },

    update: (username: string, data: AdminUpdate) => {
      return this.client.put<AdminResponse>(`/api/admins/${username}`, data)
    },

    updateCurrent: (data: AdminCurrentUpdate, code?: string) => {
      return this.client.put<AdminResponse>('/api/admins/current', { data, code })
    },

    delete: (username: string) => {
      return this.client.delete<Record<string, any>>(`/api/admins/${username}`)
    },

    enable: (username: string) => {
      return this.client.post<AdminResponse>(`/api/admins/${username}/enable`)
    },

    disable: (username: string) => {
      return this.client.post<AdminResponse>(`/api/admins/${username}/disable`)
    },

    revokeApiKey: (username: string) => {
      return this.client.post<AdminResponse>(`/api/admins/${username}/revoke`)
    },

    revokeTotp: (code?: string) => {
      return this.client.post<TotpProvisioningResponse>(
        '/api/admins/current/totp/revoke',
        { code }
      )
    },

    verifyTotp: (code: string) => {
      return this.client.post<void>('/api/admins/current/totp/verify', { code })
    },

    revokeCurrentApiKey: () => {
      return this.client.post<AdminResponse>('/api/admins/current/revoke')
    },

    getUsages: (username: string) => {
      return this.client.get<AdminUsageLogsResponse>(
        `/api/admins/${username}/usages`
      )
    },

    getCurrentUsages: () => {
      return this.client.get<AdminUsageLogsResponse>(
        '/api/admins/current/usages'
      )
    },

    getBackup: () => {
      return this.client.download('/api/admins/current/backup')
    },

    getSubscriptions: (username: string) => {
      return this.client.get<SubscriptionResponse[]>(
        `/api/admins/${username}/subscriptions`
      )
    },

    deleteSubscriptions: (username: string) => {
      return this.client.delete<Record<string, any>>(
        `/api/admins/${username}/subscriptions`
      )
    },

    activateSubscriptions: (username: string) => {
      return this.client.post<Record<string, any>>(
        `/api/admins/${username}/subscriptions/activate`
      )
    },

    deactivateSubscriptions: (username: string) => {
      return this.client.post<Record<string, any>>(
        `/api/admins/${username}/subscriptions/deactivate`
      )
    },
  }

  // ==================== Subscriptions ====================
  subscriptions = {
    getAll: (filters?: SubscriptionFilters) => {
      return this.client.get<SubscriptionResponse[]>('/api/subscriptions', filters)
    },

    getCount: (filters?: SubscriptionCountFilters) => {
      return this.client.get<number>('/api/subscriptions/count', filters)
    },

    getByUsername: (username: string) => {
      return this.client.get<SubscriptionResponse>(
        `/api/subscriptions/${username}`
      )
    },

    create: (data: SubscriptionCreate[]) => {
      return this.client.post<SubscriptionResponse[]>(
        '/api/subscriptions',
        data
      )
    },

    update: (username: string, data: SubscriptionUpdate) => {
      return this.client.put<SubscriptionResponse>(
        `/api/subscriptions/${username}`,
        data
      )
    },

    delete: (usernames: string[]) => {
      return this.client.delete<Record<string, any>>(
        '/api/subscriptions',
        { usernames }
      )
    },

    enable: (usernames: string[]) => {
      return this.client.post<SubscriptionResponse[]>(
        '/api/subscriptions/enable',
        { usernames }
      )
    },

    disable: (usernames: string[]) => {
      return this.client.post<SubscriptionResponse[]>(
        '/api/subscriptions/disable',
        { usernames }
      )
    },

    revoke: (usernames: string[]) => {
      return this.client.post<SubscriptionResponse[]>(
        '/api/subscriptions/revoke',
        { usernames }
      )
    },

    reset: (usernames: string[]) => {
      return this.client.post<SubscriptionResponse[]>(
        '/api/subscriptions/reset',
        { usernames }
      )
    },

    getUsages: (username: string) => {
      return this.client.get<SubscriptionUsageLogsResponse>(
        `/api/subscriptions/${username}/usages`
      )
    },

    getStats: () => {
      return this.client.get<SubscriptionStatsResponse>(
        '/api/subscriptions/stats'
      )
    },

    getSubscriptionStatusStats: () => {
      return this.client.get<SubscriptionStatusStatsResponse>(
        '/api/stats/subscriptions/status'
      )
    },

    bulkAddService: (serviceId: number) => {
      return this.client.post<Record<string, any>>(
        `/api/subscriptions/services/${serviceId}`
      )
    },

    bulkRemoveService: (serviceId: number) => {
      return this.client.delete<Record<string, any>>(
        `/api/subscriptions/services/${serviceId}`
      )
    },
  }
}
