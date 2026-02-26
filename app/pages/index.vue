<script setup lang="ts">
import { ref, watch } from 'vue'
import { useIntervalFn } from '@vueuse/core'
import AdminLimits from '~/components/dashboard/AdminLimits.vue'
import SubscriptionStatusTable from '~/components/dashboard/SubscriptionStatusTable.vue'
import OnlineUsersChart from '~/components/dashboard/OnlineUsersChart.vue'
import AvailableUsersChart from '~/components/dashboard/AvailableUsersChart.vue'
import DailyTopConsumers from '~/components/dashboard/DailyTopConsumers.vue'
import UsageChart from '~/components/dashboard/UsageChart.vue'
import AgentStats from '~/components/dashboard/AgentStats.vue'
import LastReachedList from '~/components/dashboard/LastReachedList.vue'
// import SubscriptionStatusChart from '~/components/dashboard/SubscriptionStatusChart.vue'

definePageMeta({
  middleware: 'auth',
  layout: 'default',
  alias: ['/stats']
})

const { fetchAdmin, isOwner } = useAdmin()
const { subscriptions } = useApi()
const dailyTopConsumersRef = ref<InstanceType<typeof DailyTopConsumers> | null>(null)
const isRefreshing = ref(false)

// Fetch admin data
await useAsyncData('admin-home', () => fetchAdmin())
const { data: sharedStatusStats, status: sharedStatusStatsStatus } = await useAsyncData(
  'dashboard-subscription-status-stats',
  () => subscriptions.getSubscriptionStatusStats(),
  { server: false, lazy: true }
)

const refreshAll = async () => {
  if (!isOwner.value) return
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    const promises: Promise<unknown>[] = [fetchAdmin(true)]
    if (isOwner.value) {
      promises.push(refreshNuxtData())
      const topConsumersRefresh = dailyTopConsumersRef.value?.refresh?.(true)
      if (topConsumersRefresh) {
        promises.push(topConsumersRefresh)
      }
    }
    await Promise.all(promises)
  } finally {
    isRefreshing.value = false
  }
}

const { pause: pauseAutoRefresh, resume: resumeAutoRefresh } = useIntervalFn(() => {
  refreshAll()
}, 10000, { immediate: false })

watch(isOwner, (owner) => {
  if (owner) {
    resumeAutoRefresh()
    return
  }
  pauseAutoRefresh()
}, { immediate: true })
</script>

<template>
  <div class="w-full px-4 lg:px-4 space-y-5 py-5">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-semibold tracking-tight">{{ $t('dashboard.title') }}</h2>
    </div>
    
    <template v-if="isOwner">
      <div class="space-y-3">
        <h3 class="text-base font-semibold text-muted-foreground">{{ $t('dashboard.usageLimits') }}</h3>
        <AdminLimits :status-stats="sharedStatusStats" :status-state="sharedStatusStatsStatus" />
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SubscriptionStatusTable class="md:col-span-2" :status-stats="sharedStatusStats" :status-state="sharedStatusStatsStatus" />
        <OnlineUsersChart class="col-span-1" :status-stats="sharedStatusStats" :status-state="sharedStatusStatsStatus" />
        <AvailableUsersChart class="col-span-1" :status-stats="sharedStatusStats" :status-state="sharedStatusStatsStatus" />
      </div>

      <div class="grid gap-3 md:grid-cols-3">
        <div class="col-span-1">
          <ClientOnly>
            <DailyTopConsumers ref="dailyTopConsumersRef" />
            <template #fallback>
              <div class="rounded-2xl border bg-card/60 px-4 py-6 text-xs text-muted-foreground">
                Loading top consumers…
              </div>
            </template>
          </ClientOnly>
        </div>
        <LastReachedList class="col-span-1" />
        <AgentStats class="col-span-1" />
      </div>

      <div class="grid gap-3 md:grid-cols-1">
        <div class="col-span-1">
          <ClientOnly>
            <UsageChart />
            <template #fallback>
              <div class="rounded-xl border bg-card text-card-foreground shadow h-[300px] flex items-center justify-center">
                  <span class="text-muted-foreground">Loading usage chart...</span>
              </div>
            </template>
          </ClientOnly>
        </div>
        <!-- <SubscriptionStatusChart class="md:col-span-2" /> -->
        <!-- <SubscriptionAvailabilityChart /> -->
      </div>
    </template>

    <template v-else>
      <div class="space-y-3">
        <h3 class="text-base font-semibold text-muted-foreground">{{ $t('dashboard.usageLimits') }}</h3>
        <AdminLimits :status-stats="sharedStatusStats" :status-state="sharedStatusStatsStatus" />
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SubscriptionStatusTable class="md:col-span-2" :status-stats="sharedStatusStats" :status-state="sharedStatusStatsStatus" />
        <OnlineUsersChart class="col-span-1" :status-stats="sharedStatusStats" :status-state="sharedStatusStatsStatus" />
        <AvailableUsersChart class="col-span-1" :status-stats="sharedStatusStats" :status-state="sharedStatusStatsStatus" />
      </div>
    </template>
  </div>
</template>
