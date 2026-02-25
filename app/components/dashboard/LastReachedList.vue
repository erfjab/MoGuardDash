<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, Clock, BatteryCharging } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import { useTimeAgo } from '@vueuse/core'

const { stats } = useApi()
const { locale } = useI18n()

const { data: reachedList, status } = useAsyncData(
  'last-reached-list',
  () => stats.getLastReachedSubscriptions({ size: 50 }),
  { server: false, lazy: true }
)

function formatTimeAgo(dateString: string) {
  return useTimeAgo(dateString, {
    showSecond: false,
    messages: locale.value === 'fa' ? {
      justNow: 'همین الان',
      past: n => `${n} پیش`,
      future: n => `${n} دیگر`,
      month: (n, past) => `${n} ماه`,
      year: (n, past) => `${n} سال`,
      day: (n, past) => `${n} روز`,
      week: (n, past) => `${n} هفته`,
      hour: (n, past) => `${n} ساعت`,
      minute: (n, past) => `${n} دقیقه`,
      second: (n, past) => `${n} ثانیه`,
      invalid: ''
    } : undefined
  }).value
}

const cachedItems = ref(reachedList.value ?? [])

watch(
  () => reachedList.value,
  value => {
    if (value?.length) {
      cachedItems.value = value
    }
  },
  { immediate: true }
)

const isInitialLoading = computed(() => status.value === 'pending' && !(cachedItems.value?.length))
const reachedItems = computed(() => cachedItems.value ?? [])
</script>

<template>
  <Card class="flex flex-col h-full">
    <CardHeader class="pb-3">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div class="flex items-center gap-2">
          <CardTitle class="flex items-center gap-2 text-base font-semibold">
            <AlertTriangle class="h-4 w-4" />
            {{ $t('dashboard.lastReachedLimits') }}
          </CardTitle>
        </div>
      </div>
      <CardDescription class="mt-0.5 text-xs">{{ $t('dashboard.lastReachedDescription') }}</CardDescription>
    </CardHeader>
    <CardContent class="p-0 overflow-hidden flex-1">
      <ScrollArea class="h-[260px] px-3 scroll-smooth">
        <div v-if="isInitialLoading" class="space-y-2 py-2">
          <div v-for="i in 8" :key="i" class="h-10 rounded border border-border/60 bg-muted/20 animate-pulse" />
        </div>
        <div v-else-if="!reachedItems.length" class="text-center text-muted-foreground py-4 text-sm">
          {{ $t('dashboard.noDataAvailable') }}
        </div>
        <div v-else class="py-1 text-sm">
          <div 
            v-for="(item, index) in reachedItems.slice(0, 10)" 
            :key="`${item.username}-${index}`"
            class="flex items-center justify-between gap-3 border-b border-border/40 py-2 last:border-b-0"
          >
            <div class="flex flex-col gap-1 min-w-0 flex-1">
              <span class="font-medium truncate">{{ item.username }}</span>
              <span class="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock class="h-3 w-3" />
                {{ formatTimeAgo(item.reached_at) }}
              </span>
            </div>
            <div class="flex items-center gap-2 shrink-0">
              <div
                v-if="item.limited"
                class="flex items-center gap-1 rounded-full border border-red-400/40 bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-600 dark:text-red-400"
              >
                {{ $t('dashboard.limited') }}
              </div>
              <div
                v-if="item.expired"
                class="flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400"
              >
                {{ $t('dashboard.expired') }}
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    </CardContent>
  </Card>
</template>
