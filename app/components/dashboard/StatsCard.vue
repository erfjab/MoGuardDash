<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import AnimatedNumber from './AnimatedNumber.vue'
import { ArrowUp, ArrowDown, Minus } from 'lucide-vue-next'
import { formatBytes } from '~/lib/api-helpers'

const props = defineProps<{
  title: string
  value: number
  compareValue?: number
  compareLabel?: string
  formatBytes?: boolean
  icon?: any
  color?: 'default' | 'success' | 'warning' | 'destructive'
}>()

const changeDiff = computed(() => {
  if (!props.compareValue) return 0
  return props.value - props.compareValue
})

const changeType = computed(() => {
  if (changeDiff.value > 0) return 'increase'
  if (changeDiff.value < 0) return 'decrease'
  return 'neutral'
})

const badgeVariant = computed(() => {
  if (changeType.value === 'increase') return 'default'
  if (changeType.value === 'decrease') return 'secondary'
  return 'outline'
})

const formattedDiff = computed(() => {
  const absValue = Math.abs(changeDiff.value)
  if (props.formatBytes) {
    return formatBytes(absValue)
  }
  return absValue.toLocaleString()
})
</script>

<template>
  <Card>
    <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle class="text-sm font-medium">{{ title }}</CardTitle>
      <component :is="icon" v-if="icon" class="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div class="text-2xl font-bold">
        <AnimatedNumber :value="value" :format-bytes="!!formatBytes" />
      </div>
      <div v-if="compareValue !== undefined" class="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Badge :variant="badgeVariant" class="gap-1">
          <ArrowUp v-if="changeType === 'increase'" class="h-3 w-3" />
          <ArrowDown v-if="changeType === 'decrease'" class="h-3 w-3" />
          <Minus v-if="changeType === 'neutral'" class="h-3 w-3" />
          {{ changeType === 'increase' ? '+' : changeType === 'decrease' ? '-' : '' }}{{ formattedDiff }}
        </Badge>
        <span>{{ compareLabel }}</span>
      </div>
    </CardContent>
  </Card>
</template>
