import { onBeforeUnmount, readonly, ref, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'

const REFRESH_INTERVAL_STORAGE_KEY = 'guarddash_refresh_interval'
const DEFAULT_REFRESH_INTERVAL = 30_000

interface UseAutoRefreshOptions {
  interval?: number
  immediate?: boolean
}

interface SetIntervalOptions {
  restart?: boolean
  runNow?: boolean
}

type MaybePromise<T> = T | Promise<T>

/**
 * Get cached refresh interval from localStorage
 */
function getCachedInterval(): number {
  if (!import.meta.client) return DEFAULT_REFRESH_INTERVAL
  try {
    const cached = localStorage.getItem(REFRESH_INTERVAL_STORAGE_KEY)
    if (cached) {
      const parsed = parseInt(cached, 10)
      if (!isNaN(parsed) && parsed > 0) {
        return parsed
      }
    }
  } catch {
    // Ignore storage errors
  }
  return DEFAULT_REFRESH_INTERVAL
}

/**
 * Save refresh interval to localStorage
 */
function setCachedInterval(interval: number): void {
  if (!import.meta.client) return
  try {
    localStorage.setItem(REFRESH_INTERVAL_STORAGE_KEY, String(interval))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Provides a lightweight interval runner that prevents overlapping refresh calls.
 */
export function useAutoRefresh(handler: () => MaybePromise<void>, options: UseAutoRefreshOptions = {}) {
  // Use cached interval if no specific interval provided, otherwise use the provided one or default
  const cachedInterval = getCachedInterval()
  const defaultInterval = options.interval ?? cachedInterval
  const runImmediately = options.immediate ?? false

  const isAutoRefreshing = ref(false)
  const lastAutoRefreshAt = ref<number | null>(null)
  const intervalMs = ref(defaultInterval)
  const hasStarted = ref(false)

  const route = useRoute()
  const initialRoutePath = route.fullPath
  const isOnInitialRoute = () => route.fullPath === initialRoutePath

  const runHandler = async () => {
    if (isAutoRefreshing.value) return

    isAutoRefreshing.value = true
    try {
      await handler()
      lastAutoRefreshAt.value = Date.now()
    } catch (error) {
      console.error('[useAutoRefresh] handler failed', error)
    } finally {
      isAutoRefreshing.value = false
    }
  }

  const { pause, resume, isActive } = useIntervalFn(runHandler, intervalMs, {
    immediate: false,
    immediateCallback: false,
  })

  const startAutoRefresh = (runNow = runImmediately) => {
    if (!import.meta.client) return
    hasStarted.value = true

    if (runNow) {
      runHandler()
    }

    if (isOnInitialRoute()) {
      resume()
    }
  }

  const stopAutoRefresh = () => {
    hasStarted.value = false
    pause()
  }

  const setAutoRefreshInterval = (nextInterval: number, opts: SetIntervalOptions = {}) => {
    intervalMs.value = nextInterval
    // Cache the interval for persistence across page reloads
    setCachedInterval(nextInterval)

    const shouldRestart = opts.restart ?? true

    if (!shouldRestart) return

    if (hasStarted.value && isActive.value && isOnInitialRoute()) {
      pause()
      resume()
    }

    if (opts.runNow) {
      runHandler()
    }
  }

  if (import.meta.client) {
    watch(() => route.fullPath, () => {
      if (!hasStarted.value) return

      if (isOnInitialRoute()) {
        resume()
      }
      else {
        pause()
      }
    })
  }

  onBeforeUnmount(() => {
    stopAutoRefresh()
  })

  return {
    startAutoRefresh,
    stopAutoRefresh,
    triggerAutoRefresh: runHandler,
    setAutoRefreshInterval,
    isAutoRefreshing: readonly(isAutoRefreshing),
    lastAutoRefreshAt: readonly(lastAutoRefreshAt),
    intervalMs: readonly(intervalMs),
  }
}
