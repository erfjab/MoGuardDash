<script setup lang="ts">
defineProps<{
  title?: string
  data: {
    name: string
    color: string
    value: any
  }[]
}>()
</script>

<template>
  <div class="flex items-center gap-2 rounded-lg border bg-background px-2.5 py-1.5 text-xs shadow-xl">
    <div v-for="(item, key) in data" :key="key" class="flex items-center gap-2">
      <span class="h-2 w-2 rounded-full" :style="{ background: item.color }" />
      <span class="font-medium">{{ title }}</span>
      <span class="text-muted-foreground">{{ item.value }}</span>
    </div>
  </div>
</template>
