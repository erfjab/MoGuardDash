import type { AdminResponse, ServiceResponse, SubscriptionResponse, NodeResponse } from '~/types/api'

export const useAdmin = () => {
  const api = useApi()
  
  // State for admin info
  const admin = useState<AdminResponse | null>('admin_info', () => null)
  
  // State for services
  const services = useState<ServiceResponse[]>('admin_services', () => [])

  // State for nodes
  const nodes = useState<NodeResponse[]>('admin_nodes', () => [])

  // State for initial subscriptions (page 1, default sort)
  const initialSubscriptions = useState<SubscriptionResponse[]>('admin_initial_subscriptions', () => [])
  const initialSubscriptionsCount = useState<number>('admin_initial_subscriptions_count', () => 0)
  
  // Fetch lock to prevent concurrent requests
  const isFetchingSubscriptions = useState<boolean>('admin_fetching_subscriptions', () => false)

  // Fetch admin info
  const fetchAdmin = async (force = false) => {
    if (admin.value && !force) return admin.value
    
    try {
      const response = await api.admins.getCurrent()
      admin.value = response
      return response
    } catch (error) {
      console.error('Failed to fetch admin info', error)
      throw error
    }
  }

  // Fetch services
  const fetchServices = async (force = false) => {
    if (services.value.length > 0 && !force) return services.value

    try {
      const response = await api.services.getAll()
      services.value = response
      return response
    } catch (error) {
      console.error('Failed to fetch services', error)
      throw error
    }
  }

  // Fetch nodes
  const fetchNodes = async (force = false) => {
    if (nodes.value.length > 0 && !force) return nodes.value

    try {
      const response = await api.nodes.getAll()
      nodes.value = response
      return response
    } catch (error) {
      console.error('Failed to fetch nodes', error)
      throw error
    }
  }

  // Fetch initial subscriptions
  const fetchInitialSubscriptions = async (force = false) => {
    // Return cached data if available and not forcing refresh
    if (initialSubscriptions.value.length > 0 && !force) {
      return {
        subscriptions: initialSubscriptions.value,
        count: initialSubscriptionsCount.value
      }
    }

    // Prevent concurrent requests
    if (isFetchingSubscriptions.value) {
      // Wait a bit and return current data
      return {
        subscriptions: initialSubscriptions.value,
        count: initialSubscriptionsCount.value
      }
    }

    isFetchingSubscriptions.value = true
    try {
      const [subscriptions, count] = await Promise.all([
        api.subscriptions.getAll({ page: 1, size: 10, order_by: 'created_at_desc' }),
        api.subscriptions.getCount({})
      ])
      
      initialSubscriptions.value = subscriptions
      initialSubscriptionsCount.value = count
      
      return { subscriptions, count }
    } catch (error) {
      console.error('Failed to fetch initial subscriptions', error)
      throw error
    } finally {
      isFetchingSubscriptions.value = false
    }
  }

  // Update admin info (optimistic or after API call)
  const setAdmin = (data: AdminResponse) => {
    admin.value = data
  }

  // Check if current admin is owner
  const isOwner = computed(() => admin.value?.role === 'owner')

  // Clear all data (logout)
  const clearData = () => {
    admin.value = null
    services.value = []
    nodes.value = []
    initialSubscriptions.value = []
    initialSubscriptionsCount.value = 0
  }

  return {
    admin,
    services,
    nodes,
    initialSubscriptions,
    initialSubscriptionsCount,
    isOwner,
    fetchAdmin,
    fetchServices,
    fetchNodes,
    fetchInitialSubscriptions,
    setAdmin,
    clearData
  }
}
