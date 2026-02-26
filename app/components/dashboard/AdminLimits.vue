<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Database, Users, Infinity as InfinityIcon, Clock, Shield } from 'lucide-vue-next'
import AnimatedNumber from './AnimatedNumber.vue'
import { formatBytes } from '~/lib/api-helpers'
import type { SubscriptionStatusStatsResponse } from '~/types/api'

const { admin } = useAdmin()
const { t } = useI18n()
const props = withDefaults(defineProps<{
  statusStats?: SubscriptionStatusStatsResponse | null
  statusState?: string
}>(), {
  statusStats: null,
  statusState: 'success',
})

const isLoading = computed(() => !admin.value || !props.statusStats)

const usageLimit = computed(() => admin.value?.usage_limit)
const leftUsage = computed(() => admin.value?.left_usage)
const currentUsage = computed(() => admin.value?.current_usage || 0)
const isUsageUnlimited = computed(() => !usageLimit.value)

const countLimit = computed(() => admin.value?.count_limit)
const leftCount = computed(() => admin.value?.left_count)
const currentCount = computed(() => admin.value?.current_count || 0)
const isCountUnlimited = computed(() => !countLimit.value)

const role = computed(() => admin.value?.role || 'Unknown')

const parseUtcDate = (value?: string | null) => {
  if (!value) return null
  const trimmed = value.trim()
  if (!trimmed) return null

  const hasTimezone = /(Z|[+-]\d{2}:\d{2})$/i.test(trimmed)
  const normalized = hasTimezone
    ? trimmed
    : `${trimmed.replace(' ', 'T')}Z`

  const date = new Date(normalized)
  return Number.isNaN(date.getTime()) ? null : date
}

const activeDurationData = computed(() => {
  const created = parseUtcDate(admin.value?.created_at)
  if (!created) return { value: 0, unit: 'Unknown' }
  
  const diffMs = Date.now() - created.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  
  if (diffDays >= 1) {
    return { value: diffDays, unit: t('time.days') }
  } else if (diffHours >= 1) {
    return { value: diffHours, unit: 'hours' }
  } else {
    const diffMinutes = Math.floor(diffMs / (1000 * 60))
    return { value: diffMinutes, unit: 'minutes' }
  }
})

</script>

<template>
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
    <!-- Usage Card -->
    <Card class="py-2">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle class="text-xs font-medium tracking-tight">
          {{ $t('dashboard.totalUsage') }}
        </CardTitle>
        <Database class="h-3.5 w-3.5 text-muted-foreground" />
      </CardHeader>
      <CardContent class="flex items-center justify-between gap-2">
        <div v-if="isLoading" class="w-full space-y-2">
          <Skeleton class="h-8 w-24" />
          <Skeleton class="h-4 w-16" />
        </div>
        <template v-else>
          <div class="text-2xl font-bold">
            <AnimatedNumber :value="props.statusStats?.total_usage || 0" :format-bytes="true" :duration="2500" />
          </div>
          <Badge v-if="role !== 'owner'" class="font-normal text-[0.65rem]">
            <span v-if="!isUsageUnlimited">
              {{ formatBytes(leftUsage || 0) }} {{ $t('dashboard.left') }}
            </span>
            <span v-else class="flex items-center gap-1">
              <InfinityIcon class="h-3 w-3" /> {{ $t('dashboard.unlimited') }}
            </span>
          </Badge>
        </template>
      </CardContent>
    </Card>

    <!-- Users Card -->
    <Card class="py-2">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle class="text-xs font-medium tracking-tight">
          {{ $t('dashboard.totalCount') }}
        </CardTitle>
        <Users class="h-3.5 w-3.5 text-muted-foreground" />
      </CardHeader>
      <CardContent class="flex items-center justify-between gap-2">
        <div v-if="isLoading" class="w-full space-y-2">
          <Skeleton class="h-8 w-24" />
          <Skeleton class="h-4 w-16" />
        </div>
        <template v-else>
          <div class="text-2xl font-bold">
            <AnimatedNumber :value="props.statusStats?.total || 0" :duration="2500" />
          </div>
          <Badge v-if="role !== 'owner'" class="font-normal text-[0.65rem]">
            <span v-if="!isCountUnlimited">
              {{ leftCount }} {{ $t('dashboard.usersLeft') }}
            </span>
            <span v-else class="flex items-center gap-1">
              <InfinityIcon class="h-3 w-3" /> {{ $t('dashboard.unlimited') }}
            </span>
          </Badge>
        </template>
      </CardContent>
    </Card>

    <!-- Last 24h Usage Card -->
    <Card class="py-2">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle class="text-xs font-medium tracking-tight">
          {{ $t('dashboard.last24hUsage') }}
        </CardTitle>
        <Clock class="h-3.5 w-3.5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div v-if="isLoading" class="w-full">
          <Skeleton class="h-8 w-32" />
        </div>
        <div v-else class="text-2xl font-bold capitalize">
          <AnimatedNumber :value="props.statusStats?.last_24h_usage || 0" :format-bytes="true" :duration="2500" />
        </div>
      </CardContent>
    </Card>

    <!-- Role Card -->
    <Card class="py-2">
      <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-1">
        <CardTitle class="text-xs font-medium tracking-tight">
          {{ $t('dashboard.last24hOnline') }}
        </CardTitle>
        <Shield class="h-3.5 w-3.5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div v-if="isLoading" class="w-full">
          <Skeleton class="h-8 w-20" />
        </div>
        <div v-else class="text-2xl font-bold capitalize">
          <AnimatedNumber :value="props.statusStats?.last_24h_online || 0" :duration="2500" />
        </div>
      </CardContent>
    </Card>
  </div>
</template>
