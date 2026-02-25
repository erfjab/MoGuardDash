<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AreaChart } from '@/components/ui/chart-area'
import CountChartTooltip from '@/components/dashboard/CountChartTooltip.vue'
import { formatDateTimeSmart } from '~/lib/api-helpers'
import type { CountDetailStats } from '@/types/api'

const props = defineProps<{
  title?: string
  description?: string
  data: CountDetailStats[]
  period?: string
  unitLabel?: string
}>()

const numberFormatter = new Intl.NumberFormat('en-US')

const chartData = computed(() => {
  return props.data.map((item, index) => ({
    time: item.start ? formatDateTimeSmart(item.start, props.period) : `Point ${index + 1}`,
    count: item.count,
    countDisplay: numberFormatter.format(item.count),
    start: item.start,
    end: item.end,
    startLabel: item.start ? formatDateTimeSmart(item.start, props.period) : null,
    endLabel: item.end ? formatDateTimeSmart(item.end, props.period) : null
  }))
})

const yFormatter = (value: number | Date) => (typeof value === 'number' ? numberFormatter.format(value) : '0')
</script>

<template>
  <Card>
  <CardHeader v-if="title || description || unitLabel" class="pb-2">
      <div class="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <CardTitle class="text-sm font-semibold">{{ title }}</CardTitle>
          <CardDescription v-if="description">{{ description }}</CardDescription>
        </div>
        <span v-if="unitLabel" class="text-xs font-medium text-muted-foreground">{{ unitLabel }}</span>
      </div>
    </CardHeader>
    <CardContent class="pt-4 sm:pt-6">
      <AreaChart 
        :data="chartData" 
        :categories="['count']"
        index="time"
        :y-formatter="yFormatter"
        :show-legend="false"
        :custom-tooltip="CountChartTooltip"
        :show-x-axis="false"
        class="h-[180px] sm:h-[220px]"
      />
    </CardContent>
  </Card>
</template>
