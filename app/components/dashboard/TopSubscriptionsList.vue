<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { computed, type Component } from 'vue'
import type { TopSubDetailStats } from '@/types/api'
import { formatBytes } from '~/lib/api-helpers'

const props = withDefaults(defineProps<{
  title: string
  description?: string
  icon?: Component
  data: TopSubDetailStats[]
  loading?: boolean
  emptyText?: string
}>(), {
  loading: false,
  emptyText: 'No data available',
})

const topEntries = computed(() => props.data.slice(0, 10))
</script>

<template>
  <Card class="h-full flex flex-col">
    <CardHeader class="pb-3">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <CardTitle class="flex items-center gap-2 text-base font-semibold">
            <component :is="icon" v-if="icon" class="h-4 w-4" />
            {{ title }}
          </CardTitle>
          <CardDescription v-if="description" class="text-xs mt-0.5">{{ description }}</CardDescription>
        </div>
        <slot name="actions" />
      </div>
    </CardHeader>
    <CardContent class="flex-1 p-0 overflow-hidden">
      <ScrollArea class="h-[260px] px-3 scroll-smooth">
        <div v-if="loading" class="space-y-1.5 py-2">
          <div v-for="i in 8" :key="`skeleton-${i}`" class="flex items-center justify-between gap-3 rounded border border-border/50 bg-muted/20 px-3 py-2 animate-pulse">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <Skeleton class="h-6 w-6 rounded-full" />
              <Skeleton class="h-4 w-28" />
            </div>
            <Skeleton class="h-4 w-16" />
          </div>
        </div>
        <div v-else-if="!topEntries.length" class="text-center text-muted-foreground py-6 text-sm">
          {{ emptyText }}
        </div>
        <div v-else class="py-1 text-sm">
          <div 
            v-for="(item, index) in topEntries" 
            :key="`${item.username}-${index}`"
            class="flex items-center justify-between gap-3 border-b border-border/40 py-2 last:border-b-0"
          >
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <span 
                class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-muted/40 text-[10px] font-semibold"
                :class="index < 3 ? 'text-foreground' : 'text-muted-foreground'">
                {{ index + 1 }}
              </span>
              <div class="truncate">
                <p class="font-medium leading-tight truncate">{{ item.username }}</p>
                <p class="text-[10px] text-muted-foreground" v-if="!item.is_active">Inactive</p>
              </div>
            </div>
            <div class="text-right flex-shrink-0 ml-3">
              <p class="font-mono text-xs font-semibold text-foreground">{{ formatBytes(item.usage) }}</p>
            </div>
          </div>
        </div>
      </ScrollArea>
    </CardContent>
    <CardFooter v-if="$slots.footer" class="justify-center pb-4 pt-2">
      <slot name="footer" />
    </CardFooter>
  </Card>
</template>
