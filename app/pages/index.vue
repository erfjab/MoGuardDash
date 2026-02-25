<script setup lang="ts">
import { ref } from 'vue'
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
const dailyTopConsumersRef = ref<InstanceType<typeof DailyTopConsumers> | null>(null)
const isRefreshing = ref(false)

// Fetch admin data
await useAsyncData('admin-home', () => fetchAdmin())

const refreshAll = async () => {
  if (isRefreshing.value) return
  isRefreshing.value = true
  try {
    const promises = [fetchAdmin(true)]
    if (isOwner.value) {
      promises.push(refreshNuxtData())
      promises.push(dailyTopConsumersRef.value?.refresh?.(true))
    }
    await Promise.all(promises)
  } finally {
    isRefreshing.value = false
  }
}

useIntervalFn(() => {
  refreshAll()
}, 10000)
</script>

<template>
  <div class="w-full px-4 lg:px-4 space-y-5 py-5">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-semibold tracking-tight">{{ $t('dashboard.title') }}</h2>
    </div>
    
    <template v-if="isOwner">
      <div class="space-y-3">
        <h3 class="text-base font-semibold text-muted-foreground">{{ $t('dashboard.usageLimits') }}</h3>
        <AdminLimits />
      </div>

      <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SubscriptionStatusTable class="md:col-span-2" />
        <OnlineUsersChart class="col-span-1" />
        <AvailableUsersChart class="col-span-1" />
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

    <div v-else class="flex flex-col items-center justify-center p-12 text-center border dashed rounded-xl bg-card text-card-foreground shadow-sm mt-8">
      <div class="p-4 mb-6 rounded-full bg-primary/10">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
        </svg>
      </div>
      <h3 class="text-xl font-semibold mb-3">سیستم آمار در حال بروزرسانی است</h3>
      <p class="text-muted-foreground max-w-lg leading-relaxed">
          کاربر گرامی،
          بخش آمار و گزارشات به دلیل ارتقای زیرساخت و بهبود عملکرد سرورها، موقتاً در دسترس نمی‌باشد.
      </p>
    </div>
  </div>
</template>
