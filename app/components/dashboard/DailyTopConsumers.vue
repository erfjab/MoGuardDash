<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { endOfDay, format, startOfDay, subDays } from 'date-fns'
import { ChevronLeft, ChevronRight, BarChart3 } from 'lucide-vue-next'
import TopSubscriptionsList from '@/components/dashboard/TopSubscriptionsList.vue'
import { Button } from '@/components/ui/button'
import type { TopSubDetailStats } from '@/types/api'

const MAX_HISTORY_DAYS = 30

const api = useApi()
const selectedOffset = ref(0)
const topConsumers = ref<TopSubDetailStats[]>([])
const isLoading = ref(false)
const rangeWindow = ref<{ start: string; end: string } | null>(null)
let activeRequest: symbol | null = null

const currentDateLabel = computed(() => {
  const offset = selectedOffset.value
  const targetDate = subDays(new Date(), offset)
  const { t } = useI18n()
  
  if (offset === 0) return t('dashboard.today')
  if (offset === 1) return t('dashboard.yesterday')
  
  return format(targetDate, 'MMM d')
})

const rangeDescription = computed(() => {
  const { t } = useI18n()
  if (!rangeWindow.value) {
    return t('dashboard.dailyTopConsumersDescription')
  }
  return t('dashboard.usageLeaderboard', { date: format(new Date(rangeWindow.value.start), 'EEEE, MMM d') })
})

const buildDateRange = (offset: number) => {
  const targetDate = subDays(new Date(), offset)
  const start = startOfDay(targetDate)
  const end = endOfDay(targetDate)
  return {
    startISO: start.toISOString(),
    endISO: end.toISOString(),
  }
}

const fetchTopConsumers = async (isBackground = false) => {
  const requestId = Symbol('daily-top-consumers')
  activeRequest = requestId
  if (!isBackground) {
    isLoading.value = true
  }

  const { startISO, endISO } = buildDateRange(selectedOffset.value)

  try {
    const response = await api.stats.getMostUsageSubscriptions({
      start_date: startISO,
      end_date: endISO,
    })

    if (activeRequest !== requestId) return

    topConsumers.value = response.subscriptions
    rangeWindow.value = {
      start: response.start_date,
      end: response.end_date,
    }
  } catch (error) {
    console.error('Failed to load daily top consumers', error)
    if (activeRequest !== requestId) return

    if (topConsumers.value.length > 0) return

    topConsumers.value = []
  } finally {
    if (activeRequest === requestId) {
      isLoading.value = false
    }
  }
}

if (import.meta.client) {
  watch(
    selectedOffset,
    () => {
      fetchTopConsumers()
    },
    { immediate: true }
  )
}

defineExpose({
  refresh: fetchTopConsumers
})
</script>

<template>
  <TopSubscriptionsList
    :title="$t('dashboard.dailyTopConsumers')"
    :description="rangeDescription"
    :icon="BarChart3"
    :data="topConsumers"
    :loading="isLoading"
    empty-text="No usage data for this day"
  >
  </TopSubscriptionsList>
</template>
