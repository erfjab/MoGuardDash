<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { computed, useAttrs, onMounted, ref, watch } from 'vue'
import { PieChart } from 'lucide-vue-next'
import AnimatedNumber from './AnimatedNumber.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()

type StatusKey = 'active' | 'disabled' | 'expired' | 'limited' | 'pending'

const { subscriptions } = useApi()
const { data: statusStats, status } = useAsyncData(
  'subscription-status-stats-table',
  () => subscriptions.getSubscriptionStatusStats(),
  { server: false, lazy: true }
)

const isMounted = ref(false)
onMounted(() => {
  // Small delay to ensure transition happens after mount
  setTimeout(() => {
    isMounted.value = true
  }, 100)
})

const cachedStats = ref(statusStats.value)
watch(
  () => statusStats.value,
  value => {
    if (value) {
      cachedStats.value = value
    }
  },
  { immediate: true }
)

const statsData = computed(() => statusStats.value ?? cachedStats.value ?? null)

const total = computed(() => statsData.value?.total ?? 0)

const statusMeta: Array<{
  key: StatusKey
  label: string
  description: string
  color: string
}> = [
  { key: 'active', label: 'dashboard.active', description: 'dashboard.activeDescription', color: 'var(--chart-1)' },
  { key: 'pending', label: 'dashboard.pending', description: 'dashboard.pendingDescription', color: 'var(--chart-5)' },
  { key: 'limited', label: 'dashboard.limited', description: 'dashboard.limitedDescription', color: 'var(--chart-4)' },
  { key: 'expired', label: 'dashboard.expired', description: 'dashboard.expiredDescription', color: 'var(--chart-3)' },
  { key: 'disabled', label: 'dashboard.disabled', description: 'dashboard.disabledDescription', color: 'var(--chart-2)' },
]

const rows = computed(() => {
  const palette = ['var(--chart-5)', 'var(--chart-4)', 'var(--chart-3)', 'var(--chart-2)', 'var(--chart-1)']

  const sorted = statusMeta
    .map(meta => {
      const value = statsData.value?.[meta.key] ?? 0
      const percentage = total.value > 0 ? Number(((value / total.value) * 100).toFixed(1)) : 0
      return { ...meta, value, percentage }
    })
    .sort((a, b) => b.value - a.value)

  return sorted.map((row, index) => ({
    ...row,
    color: palette[index] || palette[palette.length - 1],
  }))
})

const isLoading = computed(() => status.value === 'pending' && !statsData.value)
const hasError = computed(() => status.value === 'error' && !statsData.value)
const isEmpty = computed(() => !isLoading.value && rows.value.every(row => row.value === 0))
</script>

<template>
  <Card class="h-full col-span-1 md:col-span-2" v-bind="attrs">
    <CardHeader class="pb-2">
      <CardTitle class="flex items-center gap-2 text-base font-semibold">
        <PieChart class="h-4 w-4" />
        {{ $t('dashboard.userStatusOverview') }}
      </CardTitle>
      <CardDescription class="text-xs mt-0.5">{{ $t('dashboard.userStatusDescription') }}</CardDescription>
    </CardHeader>
    <CardContent>
      <div v-if="isLoading" class="space-y-4 py-2">
        <div v-for="i in 5" :key="i" class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <Skeleton class="h-8 w-8 rounded-full" />
            <div class="space-y-1">
              <Skeleton class="h-4 w-24" />
              <Skeleton class="h-3 w-32" />
            </div>
          </div>
          <div class="space-y-1 text-right">
            <Skeleton class="ml-auto h-4 w-8" />
            <Skeleton class="ml-auto h-3 w-12" />
          </div>
        </div>
      </div>
      <div v-else-if="hasError" class="flex h-[180px] items-center justify-center text-sm text-muted-foreground">
        {{ $t('dashboard.dataNotLoaded') }}
      </div>
      <div v-else-if="isEmpty" class="flex h-[180px] items-center justify-center text-muted-foreground">
        {{ $t('dashboard.noDataAvailable') }}
      </div>
      <div v-else class="space-y-1">
        <div
          v-for="row in rows"
          :key="row.key"
          class="py-2"
          :class="{ 'opacity-60': row.value === 0 }"
        >
          <div class="flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <span class="flex h-8 w-8 items-center justify-center rounded-full bg-muted/60">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 duration-1000" :style="{ backgroundColor: row.color, animationDuration: '3s' }" />
                  <span class="relative inline-flex h-full w-full rounded-full" :style="{ backgroundColor: row.color }" />
                </span>
              </span>
              <div>
                <p class="text-sm font-medium leading-none">{{ $t(row.label) }}</p>
                <p class="text-[10px] text-muted-foreground mt-0.5">{{ $t(row.description) }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-mono text-sm font-semibold leading-none">
                <AnimatedNumber :value="row.value" :duration="1500" />
              </p>
              <p class="text-[10px] text-muted-foreground mt-0.5">
                <AnimatedNumber :value="row.percentage" :duration="1500" :format-options="{ minimumFractionDigits: 1, maximumFractionDigits: 1 }" />%
              </p>
            </div>
          </div>
          <div class="mt-2 h-1 w-full overflow-hidden rounded-full bg-muted/50">
            <div
              class="h-full rounded-full transition-all duration-1000 ease-out"
              :style="{ width: isMounted ? `${row.percentage}%` : '0%', backgroundColor: row.color }"
            />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
