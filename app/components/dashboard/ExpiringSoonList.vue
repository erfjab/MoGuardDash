<script setup lang="ts">
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-vue-next'
import type { ExpireSubDetailStats } from '@/types/api'

defineProps<{
  title: string
  description?: string
  data: ExpireSubDetailStats[]
}>()

function formatExpireDate(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) {
    return `${days}d ${hours}h`
  }
  return `${hours}h`
}
</script>

<template>
  <Card>
    <CardHeader class="pb-3">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div class="flex items-center gap-2">
          <CardTitle class="flex items-center gap-2 text-base">
            <Clock class="h-4 w-4" />
            {{ title }}
          </CardTitle>
        </div>
        <slot name="actions" />
      </div>
      <CardDescription v-if="description" class="mt-1 text-xs">{{ description }}</CardDescription>
    </CardHeader>
    <CardContent>
      <div class="space-y-1.5">
        <div 
          v-for="(item, index) in data.slice(0, 10)" 
          :key="index"
          class="flex items-center justify-between rounded-md border px-3 py-2 text-sm hover:bg-accent/50 transition-colors"
        >
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <div class="truncate">
              <span class="font-medium">{{ item.username }}</span>
              <Badge 
                v-if="!item.is_active"
                variant="secondary" 
                class="ml-2 text-[10px] px-1.5 py-0"
              >
                Inactive
              </Badge>
            </div>
          </div>
          <Badge variant="outline" class="text-xs flex-shrink-0 ml-3">
            {{ formatExpireDate(item.expire) }}
          </Badge>
        </div>
        <div v-if="data.length === 0" class="py-8 text-center text-xs text-muted-foreground">
          No expiring subscriptions
        </div>
      </div>
    </CardContent>
  </Card>
</template>
