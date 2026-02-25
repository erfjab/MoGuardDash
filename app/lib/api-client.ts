import type { FetchError } from 'ofetch'
import type { ApiError } from '~/types/api'

export interface ApiClientConfig {
  baseURL: string
  onError?: (error: ApiError) => void
  onUnauthorized?: () => void
}

export class ApiClient {
  private baseURL: string
  private token: string | null = null
  private apiKey: string | null = null
  private onError?: (error: ApiError) => void
  private onUnauthorized?: () => void
  private isClient: boolean

  constructor(config: ApiClientConfig) {
    this.baseURL = config.baseURL
    this.onError = config.onError
    this.onUnauthorized = config.onUnauthorized
    this.isClient = import.meta.client
  }

  setToken(token: string | null) {
    this.token = token
    if (this.isClient) {
      if (token) {
        localStorage.setItem('guard_token', token)
      } else {
        localStorage.removeItem('guard_token')
      }
    }
  }

  setApiKey(apiKey: string | null) {
    this.apiKey = apiKey
    if (this.isClient) {
      if (apiKey) {
        localStorage.setItem('guard_api_key', apiKey)
      } else {
        localStorage.removeItem('guard_api_key')
      }
    }
  }

  getToken(): string | null {
    if (!this.token && this.isClient) {
      this.token = localStorage.getItem('guard_token')
    }
    return this.token
  }

  getApiKey(): string | null {
    if (!this.apiKey && this.isClient) {
      this.apiKey = localStorage.getItem('guard_api_key')
    }
    return this.apiKey
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    const token = this.getToken()
    const apiKey = this.getApiKey()

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    if (apiKey) {
      headers['X-API-Key'] = apiKey
    }

    return headers
  }

  private createError(
    error: any,
    endpoint: string,
    method: string
  ): ApiError {
    const timestamp = new Date().toISOString()

    if (error.response) {
      // FetchError with response
      return {
        status: error.response.status || 500,
        statusText: error.response.statusText || 'Unknown Error',
        endpoint,
        method,
        message: error.response._data?.detail || error.message || 'Request failed',
        detail: error.response._data,
        timestamp,
      }
    }

    // Network or other errors
    return {
      status: 0,
      statusText: 'Network Error',
      endpoint,
      method,
      message: error.message || 'Network request failed',
      detail: error,
      timestamp,
    }
  }

  private handleError(error: any, endpoint: string, method: string): never {
    const apiError = this.createError(error, endpoint, method)

    // Handle unauthorized
    if (apiError.status === 401 && this.onUnauthorized) {
      this.onUnauthorized()
    }

    // Call error handler
    if (this.onError) {
      this.onError(apiError)
    }

    throw apiError
  }

  async request<T>(
    endpoint: string,
    options: RequestInit & { params?: Record<string, any> } = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options
    const method = (fetchOptions.method || 'GET').toUpperCase()

    try {
      let url = `${this.baseURL}${endpoint}`

      // Add query parameters
      if (params) {
        const queryString = new URLSearchParams(
          Object.entries(params).filter(([_, v]) => v != null)
        ).toString()
        if (queryString) {
          url += `?${queryString}`
        }
      }

      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...this.getHeaders(),
          ...fetchOptions.headers,
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          response: {
            status: response.status,
            statusText: response.statusText,
            _data: errorData,
          },
        }
      }

      // Handle empty responses
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        return {} as T
      }

      return await response.json()
    } catch (error) {
      return this.handleError(error, endpoint, method)
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params })
  }

  async post<T>(
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
      params,
    })
  }

  async put<T>(
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      params,
    })
  }

  async delete<T>(
    endpoint: string,
    data?: any,
    params?: Record<string, any>
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
      params,
    })
  }

  async download(endpoint: string, params?: Record<string, any>): Promise<Blob> {
    const method = 'GET'
    try {
      let url = `${this.baseURL}${endpoint}`
      if (params) {
        const queryString = new URLSearchParams(
          Object.entries(params).filter(([_, v]) => v != null)
        ).toString()
        if (queryString) {
          url += `?${queryString}`
        }
      }

      const response = await fetch(url, {
        method,
        headers: {
          ...this.getHeaders(),
        },
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          response: {
            status: response.status,
            statusText: response.statusText,
            _data: errorData,
          },
        }
      }

      return await response.blob()
    } catch (error) {
      return this.handleError(error, endpoint, method)
    }
  }

  async postForm<T>(
    endpoint: string,
    data: Record<string, any>
  ): Promise<T> {
    try {
      const formData = new URLSearchParams()
      Object.entries(data).forEach(([key, value]) => {
        if (value != null) {
          formData.append(key, String(value))
        }
      })

      const token = this.getToken()
      const apiKey = this.getApiKey()

      const headers: HeadersInit = {
        'Content-Type': 'application/x-www-form-urlencoded',
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      if (apiKey) {
        headers['X-API-Key'] = apiKey
      }

      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw {
          response: {
            status: response.status,
            statusText: response.statusText,
            _data: errorData,
          },
        }
      }

      return await response.json()
    } catch (error) {
      return this.handleError(error, endpoint, 'POST')
    }
  }
}
