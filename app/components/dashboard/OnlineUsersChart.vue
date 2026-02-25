<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { computed, onMounted, ref, watch } from 'vue'
import { Users } from 'lucide-vue-next'
import AnimatedNumber from './AnimatedNumber.vue'

const { subscriptions } = useApi()
const { data: statusStats, status } = useAsyncData(
  'subscription-status-stats-online',
  () => subscriptions.getSubscriptionStatusStats(),
  { server: false, lazy: true }
)

const isMounted = ref(false)
onMounted(() => {
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
const online = computed(() => statsData.value?.online ?? 0)
const offline = computed(() => {
  const apiOffline = statsData.value?.offline
  if (typeof apiOffline === 'number') return apiOffline
  return Math.max(total.value - online.value, 0)
})
const percentage = computed(() => {
  if (total.value === 0) return 0
  return (online.value / total.value) * 100
})

const isLoading = computed(() => status.value === 'pending' && !statsData.value)
const hasError = computed(() => status.value === 'error' && !statsData.value)

const accentStart = 'var(--chart-2, #8b5cf6)'
const accentEnd = 'var(--chart-4, #6d28d9)'
const accentMuted = 'var(--chart-1, rgba(139, 92, 246, 0.15))'
const trackColor = 'var(--chart-track, rgba(15, 23, 42, 0.15))'
const tickColor = 'var(--chart-track-muted, rgba(15, 23, 42, 0.08))'
const gradientId = 'onlineGradient'

// Semi-circle config
const arcRadius = 100
const stroke = 12
const arcLength = Math.PI * arcRadius
const gaugeCenter = { x: 120, y: 120 }
const strokeDashoffset = computed(() => {
  if (!isMounted.value) return arcLength
  return arcLength - (percentage.value / 100) * arcLength
})

const gaugeTicks = Array.from({ length: 5 }, (_, index) => index / 4).map(step => {
  const angle = Math.PI - Math.PI * step
  const innerRadius = arcRadius - 12
  const outerRadius = arcRadius + 6
  return {
    x1: gaugeCenter.x + innerRadius * Math.cos(angle),
    y1: gaugeCenter.y + innerRadius * Math.sin(angle),
    x2: gaugeCenter.x + outerRadius * Math.cos(angle),
    y2: gaugeCenter.y + outerRadius * Math.sin(angle),
  }
})
</script>

<template>
  <Card class="flex flex-col">
    <CardHeader class="pb-2">
      <CardTitle class="flex items-center gap-2 text-base font-semibold">
        <Users class="h-4 w-4" />
        {{ $t('dashboard.onlineUsers') }}
      </CardTitle>
      <p class="text-xs text-muted-foreground">{{ $t('dashboard.onlineUsersDescription') }}</p>
    </CardHeader>
    <CardContent class="flex-1 pb-8 pt-8">
      <div class="flex flex-col items-center gap-8 md:flex-row md:items-center md:justify-center">
        <div v-if="isLoading" class="flex flex-col items-center gap-10 w-full">
          <div class="relative w-full max-w-[320px] flex justify-center">
             <Skeleton class="h-[140px] w-[240px] rounded-t-full rounded-b-none" />
          </div>
          <div class="mt-4 w-full max-w-[360px] flex justify-center gap-6">
             <div class="flex flex-col gap-2 items-center">
               <Skeleton class="h-3 w-12" />
               <Skeleton class="h-4 w-8" />
             </div>
             <div class="flex flex-col gap-2 items-center">
               <Skeleton class="h-3 w-12" />
               <Skeleton class="h-4 w-8" />
             </div>
          </div>
        </div>
        <div v-else-if="hasError" class="flex h-[220px] w-full items-center justify-center text-center text-sm text-muted-foreground">
          {{ $t('dashboard.dataNotLoaded') }}
        </div>
        <div v-else class="flex flex-col items-center gap-10">
          <div class="relative w-full max-w-[320px]">
            <div
              class="absolute inset-x-6 bottom-0 top-2 -z-10 rounded-full"
              :style="{ background: `radial-gradient(circle, ${accentMuted}33, transparent 70%)` }"
              aria-hidden
            />
            <svg viewBox="0 0 240 140" class="w-full" aria-hidden="true">
              <g>
                <line
                  v-for="(tick, index) in gaugeTicks"
                  :key="`tick-${index}`"
                  :x1="tick.x1"
                  :y1="tick.y1"
                  :x2="tick.x2"
                  :y2="tick.y2"
                  :stroke="tickColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                />
              </g>
              <path
                d="M20 120 A 100 100 0 0 1 220 120"
                fill="none"
                :stroke-width="stroke"
                :stroke="trackColor"
                stroke-linecap="round"
              />
              <path
                d="M20 120 A 100 100 0 0 1 220 120"
                fill="none"
                :stroke="`url(#${gradientId})`"
                :stroke-width="stroke"
                stroke-linecap="round"
                :stroke-dasharray="arcLength"
                :style="{ strokeDashoffset }"
                class="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" :stop-color="accentStart" />
                  <stop offset="100%" :stop-color="accentEnd" />
                </linearGradient>
              </defs>
            </svg>
            <div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center pt-20 md:pt-24">
              <span class="text-4xl font-bold tracking-tight md:text-6xl">
                <AnimatedNumber :value="percentage" :duration="1500" :format-options="{ maximumFractionDigits: 1 }" />%
              </span>
            </div>
          </div>
          <div class="mt-4 w-full max-w-[360px]">
            <div class="flex flex-wrap items-center justify-center gap-6 text-center text-[9px] font-medium uppercase tracking-[0.25em] text-muted-foreground/65">
              <div class="flex flex-col gap-1">
                <span>{{ $t('dashboard.online') }}</span>
                <span class="text-xs font-semibold tracking-normal text-foreground/65">
                  <AnimatedNumber :value="online" :duration="1500" />
                </span>
              </div>
              <div class="flex flex-col gap-1">
                <span>{{ $t('dashboard.offline') }}</span>
                <span class="text-xs font-semibold tracking-normal text-foreground/65">
                  <AnimatedNumber :value="offline" :duration="1500" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
