import { ApiClient } from '~/lib/api-client'
import { GuardCoreApi } from '~/lib/api'
import type { ApiError } from '~/types/api'
import { smartToast as toast } from '~/lib/smart-toast'

let apiInstance: GuardCoreApi | null = null

export const useApi = () => {
  if (!apiInstance) {
    const config = useRuntimeConfig()
    const router = useRouter()
    const silentErrorPatterns = [
      /^\/api\/stats(\/?|$)/,
      /^\/api\/subscriptions\/stats(\/?|$)/,
      /^\/api\/admins\/current(\/?|$)/,
    ]

    const shouldSilenceError = (error: ApiError) => {
      if (error.method !== 'GET') return false
      return silentErrorPatterns.some(pattern => pattern.test(error.endpoint))
    }

    // Error handler with toast notifications
    const handleError = (error: ApiError) => {
      console.error('API Error:', error)

      if (shouldSilenceError(error)) {
        return
      }

      // Create detailed error message
      const errorTitle = `${error.method} ${error.endpoint}`
      const errorMessage = Array.isArray(error.detail?.detail)
        ? error.detail.detail.map((e: any) => e.msg).join(', ')
        : error.message

      // Show toast notification
      toast.error(errorTitle, {
        description: `Status: ${error.status} - ${errorMessage}`,
        duration: 10000,
      })
    }

    // Unauthorized handler
    const handleUnauthorized = () => {
      toast.error('Session Expired', {
        description: 'Please login again to continue.',
        duration: 10000,
      })

      // Redirect to login page
      router.push('/login')
    }

    // Get base URL from runtime config or environment
    const baseURL = (config.public.apiBaseUrl as string) || 'http://localhost:8000'

    const client = new ApiClient({
      baseURL,
      onError: handleError,
      onUnauthorized: handleUnauthorized,
    })

    apiInstance = new GuardCoreApi(client)
  }

  return apiInstance
}

// Direct access to API client for custom requests
export const useApiClient = () => {
  const api = useApi()
  return (api as any).client as ApiClient
}

// Auth helpers
export const useAuth = () => {
  const api = useApi()
  const client = useApiClient()
  const router = useRouter()
  const { fetchAdmin, clearData } = useAdmin()

  const login = async (username: string, password: string, totpCode?: string) => {
    try {
      const response = await api.admins.login({ username, password }, totpCode)
      client.setToken(response.access_token)

      // Preload admin profile while keeping the login flow snappy
      fetchAdmin(true).catch(error => {
        console.warn('Admin preload failed', error)
      })

      return response
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    client.setToken(null)
    client.setApiKey(null)
    clearData()

    router.push('/login')
  }

  const isAuthenticated = () => {
    return !!client.getToken() || !!client.getApiKey()
  }

  const setApiKey = (apiKey: string) => {
    client.setApiKey(apiKey)
  }

  return {
    login,
    logout,
    isAuthenticated,
    setApiKey,
  }
}
