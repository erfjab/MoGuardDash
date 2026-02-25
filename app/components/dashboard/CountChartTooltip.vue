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
}>()

const dataMap = computed(() => {
  const map = new Map<string, any>()
  for (const item of props.data) {
    map.set(item.name, item.value)
  }
  return map
})

const count = computed(() => dataMap.value.get('countDisplay') ?? dataMap.value.get('count'))
const startLabel = computed(() => dataMap.value.get('startLabel') ?? dataMap.value.get('start'))
const endLabel = computed(() => dataMap.value.get('endLabel') ?? dataMap.value.get('end'))
</script>

<template>
  <Card class="text-xs">
    <CardHeader v-if="title" class="px-2 pb-1 border-b">
      <CardTitle class="text-sm">{{ title }}</CardTitle>
    </CardHeader>
    <CardContent class="px-2 py-2 space-y-1.5">
      <div v-if="count" class="flex items-center justify-between gap-4">
        <span class="text-muted-foreground">Count</span>
        <span class="font-semibold">{{ count }}</span>
      </div>
      <div v-if="startLabel" class="flex items-center justify-between gap-4">
        <span class="text-muted-foreground">Start</span>
        <span class="font-medium">{{ startLabel }}</span>
      </div>
      <div v-if="endLabel" class="flex items-center justify-between gap-4">
        <span class="text-muted-foreground">End</span>
        <span class="font-medium">{{ endLabel }}</span>
      </div>
    </CardContent>
  </Card>
</template>
