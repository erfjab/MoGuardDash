<script setup lang="ts">
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Globe } from 'lucide-vue-next'
import { computed, useAttrs, ref, watch } from 'vue'
import AnimatedNumber from './AnimatedNumber.vue'

defineOptions({ inheritAttrs: false })
const attrs = useAttrs()

const { stats } = useApi()
const { data: agentStats, status } = useAsyncData(
  'agent-stats',
  () => stats.getAgentStats(),
  { server: false, lazy: true }
)

const cachedAgents = ref(agentStats.value?.agents ?? [])
const hasLoaded = ref(false)

watch(
  () => agentStats.value?.agents,
  value => {
    if (value?.length) {
      cachedAgents.value = value
      hasLoaded.value = true
    }
  },
  { immediate: true }
)

const rows = computed(() => {
  if (!cachedAgents.value?.length) return []

  const total = cachedAgents.value.reduce((acc, curr) => acc + curr.count, 0)
  return cachedAgents.value
    .map((agent, index) => {
      const percentage = total > 0 ? Number(((agent.count / total) * 100).toFixed(1)) : 0
      return {
        label: agent.category,
        value: agent.count,
        percentage,
        color: `var(--chart-${(index % 5) + 1})`
      }
    })
    .sort((a, b) => b.value - a.value)
})

  const isInitialLoading = computed(() => status.value === 'pending' && !hasLoaded.value && cachedAgents.value.length === 0)
</script>

<template>
  <Card class="flex flex-col h-full" v-bind="attrs">
    <CardHeader class="pb-3">
      <CardTitle class="flex items-center gap-2 text-base font-semibold">
        <Globe class="h-4 w-4" />
        {{ $t('dashboard.userAgents') }}
      </CardTitle>
      <CardDescription class="text-xs mt-0.5">{{ $t('dashboard.userAgentsDescription') }}</CardDescription>
    </CardHeader>
    <CardContent class="flex-1 p-0 overflow-hidden">
      <ScrollArea class="h-[260px] px-3 scroll-smooth">
        <div v-if="isInitialLoading" class="space-y-2 py-3">
          <Skeleton class="h-4 w-full" v-for="i in 5" :key="i" />
        </div>
        <div v-else-if="rows.length" class="py-1 text-sm">
          <div
            v-for="row in rows.slice(0, 10)"
            :key="row.label"
            class="flex items-center justify-between gap-3 border-b border-border/40 py-2 last:border-b-0"
          >
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="h-2 w-2 rounded-full" :style="{ backgroundColor: row.color }" />
              <span class="font-medium truncate">{{ row.label }}</span>
            </div>
            <div class="flex items-center gap-3 text-[11px] font-semibold">
              <span class="text-muted-foreground">{{ row.percentage }}%</span>
              <span class="font-mono text-xs text-foreground">
                <AnimatedNumber :value="row.value" />
              </span>
            </div>
          </div>
        </div>
        <div v-else class="text-center text-muted-foreground py-6 text-sm">
          {{ $t('dashboard.noAgentActivity') }}
        </div>
      </ScrollArea>
    </CardContent>
  </Card>
</template>
