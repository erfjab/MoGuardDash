<script setup lang="ts">
import { computed } from 'vue'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const props = defineProps<{
  title?: string
  data: {
    name: string
    color: string
    value: any
  }[]
  labels?: {
    usage: string
    start: string
    end: string
  }
}>()

const dataMap = computed(() => {
  const map = new Map<string, any>()
  for (const item of props.data) {
    map.set(item.name, item.value)
  }
  return map
})

const usage = computed(() => dataMap.value.get('usageDisplay') ?? dataMap.value.get('usage'))
const startLabel = computed(() => dataMap.value.get('startLabel') ?? dataMap.value.get('start'))
const endLabel = computed(() => dataMap.value.get('endLabel') ?? dataMap.value.get('end'))
</script>

<template>
  <Card class="text-xs">
    <CardHeader v-if="title" class="px-2 pb-1 border-b">
      <CardTitle class="text-sm">{{ title }}</CardTitle>
    </CardHeader>
    <CardContent class="px-2 py-2 space-y-1.5">
      <div v-if="usage" class="flex items-center justify-between gap-4">
        <span class="text-muted-foreground">{{ labels?.usage || 'Usage' }}</span>
        <span class="font-semibold">{{ usage }}</span>
      </div>
      <div v-if="startLabel" class="flex items-center justify-between gap-4">
        <span class="text-muted-foreground">{{ labels?.start || 'Start' }}</span>
        <span class="font-medium">{{ startLabel }}</span>
      </div>
      <div v-if="endLabel" class="flex items-center justify-between gap-4">
        <span class="text-muted-foreground">{{ labels?.end || 'End' }}</span>
        <span class="font-medium">{{ endLabel }}</span>
      </div>
    </CardContent>
  </Card>
</template>
