<script setup lang="ts">
import { computed, ref, watch, h, render } from 'vue'
import { GroupedBar, Orientation } from '@unovis/ts'
import { VisAxis, VisGroupedBar, VisXYContainer, VisXYLabels, VisTooltip } from '@unovis/vue'
import UsageChartTooltip from './UsageChartTooltip.vue'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, ChevronRight, LineChart } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const { stats } = useApi()
const colorMode = useColorMode()
const { locale } = useI18n()

const isRtl = computed(() => locale.value === 'fa')

type UsageStat = { start_date: string; usage: number }
type UsageSample = { date: Date; usage: number }
type UsageChartDatum = {
  date: Date
  usage: number
  start: Date
  end: Date
}

const MAX_USAGE_BARS = 12

const selectedOffset = ref(0)
const usageSamples = ref<UsageSample[]>([])
const isLoading = ref(false)
const rangeWindow = ref<{ start: Date; end: Date } | null>(null)

const fetchUsageStats = async () => {
  isLoading.value = true
  const now = new Date()
  const msInHour = 3600 * 1000
  const currentUtcHourStart = Math.floor(now.getTime() / msInHour) * msInHour
  const currentUtcHourEnd = currentUtcHourStart + msInHour
  
  const endDateTimestamp = currentUtcHourEnd - (selectedOffset.value * MAX_USAGE_BARS * msInHour)
  const startDateTimestamp = endDateTimestamp - (MAX_USAGE_BARS * msInHour)
  
  const endDate = new Date(endDateTimestamp)
  const startDate = new Date(startDateTimestamp)
  
  rangeWindow.value = { start: startDate, end: endDate }

  try {
    const response = await stats.getUsageStats({
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString()
    })
    
    const rawSamples = response.usages ? response.usages.map((item: UsageStat) => ({
        date: new Date(item.start_date.endsWith('Z') || item.start_date.includes('+') ? item.start_date : `${item.start_date}Z`),
        usage: item.usage / (1024 ** 3) // GB
    })) : []

    const filledSamples: UsageSample[] = []
    const step = 3600 * 1000 // 1 hour

    for (let i = 0; i < MAX_USAGE_BARS; i++) {
        const slotStart = startDate.getTime() + i * step
        const slotEnd = slotStart + step
        
        const samplesInSlot = rawSamples.filter((s: UsageSample) => {
            const t = s.date.getTime()
            return t >= slotStart && t < slotEnd
        })

        if (samplesInSlot.length > 0) {
            const totalUsage = samplesInSlot.reduce((sum: number, s: UsageSample) => sum + s.usage, 0)
            filledSamples.push({
                date: new Date(slotStart),
                usage: totalUsage
            })
        } else {
            filledSamples.push({
                date: new Date(slotStart),
                usage: 0
            })
        }
    }

    usageSamples.value = filledSamples
  } catch (e) {
    console.error(e)
    if (usageSamples.value.length > 0) return
    usageSamples.value = []
  } finally {
    isLoading.value = false
  }
}

watch(selectedOffset, () => {
    fetchUsageStats()
}, { immediate: true })

const formatWithTimeZone = (date: Date, options: Intl.DateTimeFormatOptions) => {
  return new Intl.DateTimeFormat(undefined, { hour12: false, ...options }).format(date)
}

const isMobile = computed(() => windowWidth.value < 640)

const formatTimeLabel = (date: Date) => formatWithTimeZone(date, {
  hour: '2-digit',
  minute: isMobile.value ? undefined : '2-digit',
})

const chartData = computed<UsageChartDatum[]>(() => {
  const samples = usageSamples.value
  if (!samples.length) return []

  const step = 3600 * 1000 // 1 hour in ms

  let result: UsageChartDatum[] = []

  if (samples.length <= MAX_USAGE_BARS) {
    result = samples.map(sample => {
      const end = new Date(sample.date.getTime() + step)
      const now = new Date()
      return {
        ...sample,
        start: sample.date,
        end: end > now && sample.date < now ? now : end,
      }
    })
  } else {
    const chunkSize = Math.ceil(samples.length / MAX_USAGE_BARS)
    const aggregated: UsageChartDatum[] = []

    for (let i = 0; i < samples.length; i += chunkSize) {
      const chunk = samples.slice(i, i + chunkSize)
      if (!chunk.length) continue
      const usage = chunk.reduce((sum, item) => sum + item.usage, 0)
      const startPoint = chunk[0] ?? chunk[chunk.length - 1]
      const endPoint = chunk[chunk.length - 1] ?? chunk[0]
      const start = startPoint?.date ?? new Date()
      const end = new Date((endPoint?.date ?? start).getTime() + step)
      const mid = new Date(start.getTime() + (end.getTime() - start.getTime()) / 2)
      aggregated.push({
        date: mid,
        usage,
        start,
        end,
      })
    }

    result = aggregated.slice(-MAX_USAGE_BARS)
  }

  return result
})

type Data = typeof chartData.value[number]

const maxUsage = computed(() => {
  if (!chartData.value.length) return 0
  return Math.max(...chartData.value.map(d => d.usage))
})

const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    windowWidth.value = window.innerWidth
  })
}

const labelOffsetRatio = computed(() => {
  if (windowWidth.value < 640) return 0.08  // sm
  if (windowWidth.value < 768) return 0.06  // md
  if (windowWidth.value < 1024) return 0.05 // lg
  return 0.035 // xl and above
})

const yDomain = computed(() => {
  const max = maxUsage.value || 1
  const padding = max * labelOffsetRatio.value
  return [0, max + padding]
})

const barColor = (d: Data) => {
  if (!maxUsage.value) return 'var(--primary)'
  const ratio = Math.min(1, d.usage / maxUsage.value)
  const whiteMix = 32 - ratio * 18
  return `color-mix(in srgb, var(--primary) 85%, white ${whiteMix}%)`
}

const barAttributes = computed(() => ({
  [GroupedBar.selectors.bar]: {
    filter: colorMode.value === 'dark'
      ? 'drop-shadow(0 3px 6px rgba(15,23,42,0.18))'
      : 'none',
    stroke: 'color-mix(in srgb, var(--primary) 35%, white 65%)',
    'stroke-width': 1,
  },
}))

const labelAttributes = computed(() => ({
  text: {
    'text-anchor': 'start',
    'dx': 12,
    'alignment-baseline': 'middle',
    'font-weight': 600,
  },
}))

const labelColor = () => 'var(--muted-foreground)'
const labelBackgroundColor = () => 'transparent'

const x = (d: Data) => d.date.getTime()
const y = (d: Data) => d.usage

const labelFormat = (d: Data) => {
  if (isMobile.value) return ''
  return d.usage > 0 ? `${d.usage.toFixed(2)} GB` : ''
}

const labelX = (d: Data) => x(d)
const labelY = (d: Data) => {
  const offset = (maxUsage.value || 0) * labelOffsetRatio.value
  return d.usage + offset
}

const tickFormat = (d: number) => {
  return formatTimeLabel(new Date(d))
}

const xTickValues = computed(() => chartData.value.map(d => d.date.getTime()))


const isSameDayInTimeZone = (start: Date, end: Date) => {
  const dayFormatOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }

  return (
    formatWithTimeZone(start, dayFormatOptions) ===
    formatWithTimeZone(end, dayFormatOptions)
  )
}

const formatDayWithTime = (date: Date) => formatWithTimeZone(date, {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const rangeLabel = computed(() => {
    if (!rangeWindow.value) return ''
    const start = rangeWindow.value.start
    const end = rangeWindow.value.end
    
    if (isSameDayInTimeZone(start, end)) {
        return `${formatTimeLabel(start)} - ${formatTimeLabel(end)}`
    }
    return `${formatDayWithTime(start)} - ${formatTimeLabel(end)}`
})

const { t } = useI18n()

const tooltipTemplate = (d: UsageChartDatum) => {
  const div = document.createElement('div')
  const vnode = h(UsageChartTooltip, {
    data: [
      { name: 'usageDisplay', value: `${d.usage.toFixed(2)} GB`, color: '' },
      { name: 'startLabel', value: formatDayWithTime(d.start), color: '' },
      { name: 'endLabel', value: formatDayWithTime(d.end), color: '' },
    ],
    labels: {
      usage: t('tooltip.usage'),
      start: t('tooltip.start'),
      end: t('tooltip.end')
    }
  })
  render(vnode, div)
  return div
}

const tooltipTriggers = {
  [GroupedBar.selectors.bar]: tooltipTemplate,
}
</script>

<template>
  <Card class="flex flex-col h-full pb-0">
    <CardHeader>
      <CardTitle class="flex items-center gap-2">
        <LineChart class="h-4 w-4" />
        {{ $t('dashboard.usageHistory') }}
      </CardTitle>
      <CardDescription>
        {{ $t('dashboard.usageHistoryDescription') }}
      </CardDescription>
    </CardHeader>
    <CardContent class="flex-1 min-h-[300px] p-0">
      <div v-if="isLoading" class="flex h-full min-h-[300px] items-center justify-center">
        <Skeleton class="h-full w-full" />
      </div>
      <div v-else-if="chartData.length === 0" class="flex items-center justify-center h-[300px] text-muted-foreground">
        No usage data available for this period
      </div>
      <VisXYContainer
        v-else
        :data="chartData"
        height="380px" 
        :margin="{left: 20, right: 20, top: 20, bottom: 20}"
        :y-domain="yDomain"
      >
        <VisGroupedBar
          :x="x"
          :y="y"
          :color="barColor"
          :rounded-corners="5"
          :bar-padding="0.1"
          :attributes="barAttributes"
          :orientation="Orientation.Vertical"
        />
        <VisXYLabels
          :x="labelX"
          :y="labelY"
          :label="labelFormat"
          :color="labelColor"
          :background-color="labelBackgroundColor"
          :label-font-size="11"
          :clustering="false"
          :attributes="labelAttributes"
        />
        <VisTooltip :triggers="tooltipTriggers" />
        <VisAxis
          type="x"
          position="bottom"
          :tick-line="false"
          :domain-line="false"
          :grid-line="false"
          :tick-format="tickFormat"
          :tick-values="xTickValues"
          :attributes="{
            text: {
                'text-anchor': 'middle',
                'dy': 14,
                'font-weight': 600,
                'fill': 'var(--muted-foreground)',
                'fill-opacity': 1,
                'paint-order': 'stroke',
                'stroke': 'var(--background)',
                'stroke-width': 3,
            }
          }"
        />
      </VisXYContainer>
    </CardContent>
  </Card>
</template>
