<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import type { ServiceResponse } from '~/types/api'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Check, ChevronDown } from 'lucide-vue-next'

interface RefreshOption {
  label: string
  value: number
}

interface DataTableToolbarProps {
  table: Table<ServiceResponse>
  totalCount: number
  isOwner?: boolean
  refreshIntervalOptions: RefreshOption[]
  selectedRefreshInterval: number
  refreshMenuLabel: string
}

const props = defineProps<DataTableToolbarProps>()
const emit = defineEmits<{
  (e: 'create'): void
  (e: 'refreshNow'): void
  (e: 'selectRefreshInterval', interval: number): void
}>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Mobile layout -->
    <div class="flex flex-col gap-3 sm:hidden">
      <!-- Row 1: Service name search full width with count badge -->
      <div class="relative">
        <Input
          placeholder="جستجو بر اساس نام سرویس..."
          :model-value="(table.getColumn('remark')?.getFilterValue() as string) ?? ''"
          class="h-9 w-full pl-16 text-right"
          dir="rtl"
          @input="table.getColumn('remark')?.setFilterValue($event.target.value)"
        />
        <Badge variant="secondary" class="absolute left-2 top-1/2 -translate-y-1/2">
          {{ totalCount }}
        </Badge>
      </div>

      <!-- Row 2: Actions -->
      <div class="flex gap-2">
        <Button 
          v-if="isOwner"
          size="sm" 
          class="h-9 flex-1 gap-2" 
          @click="emit('create')"
        >
          <Icon name="i-lucide-plus" class="h-4 w-4" />
          ایجاد
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button size="sm" variant="outline" class="h-9 gap-1 items-center ml-auto">
              <span class="flex items-center gap-1">
                <span>به‌روزرسانی</span>
                <span class="text-sm text-muted-foreground">({{ refreshMenuLabel }})</span>
              </span>
              <ChevronDown class="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-48">
            <DropdownMenuItem class="justify-between" @click="emit('refreshNow')">
              به‌روزرسانی فوری
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              v-for="option in refreshIntervalOptions"
              :key="option.value"
              class="flex items-center justify-between gap-2"
              @click="emit('selectRefreshInterval', option.value)"
            >
              هر {{ option.label }}
              <Check v-if="selectedRefreshInterval === option.value" class="h-4 w-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <!-- Desktop/Tablet layout -->
    <div class="hidden sm:flex items-center justify-between gap-2">
      <div class="flex flex-1 items-center flex-wrap gap-2">
        <div class="relative">
          <Input
            placeholder="جستجو بر اساس نام سرویس..."
            :model-value="(table.getColumn('remark')?.getFilterValue() as string) ?? ''"
            class="h-8 w-[150px] lg:w-[250px] pl-14 text-right"
            dir="rtl"
            @input="table.getColumn('remark')?.setFilterValue($event.target.value)"
          />
          <Badge variant="secondary" class="absolute left-2 top-1/2 -translate-y-1/2 text-xs">
            {{ totalCount }}
          </Badge>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button size="sm" variant="outline" class="h-8 gap-1 items-center">
              <span class="flex items-center gap-1">
                <span>به‌روزرسانی</span>
                <span class="text-sm text-muted-foreground">({{ refreshMenuLabel }})</span>
              </span>
              <ChevronDown class="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-48">
            <DropdownMenuItem class="justify-between" @click="emit('refreshNow')">
              به‌روزرسانی فوری
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              v-for="option in refreshIntervalOptions"
              :key="option.value"
              class="flex items-center justify-between gap-2"
              @click="emit('selectRefreshInterval', option.value)"
            >
              هر {{ option.label }}
              <Check v-if="selectedRefreshInterval === option.value" class="h-4 w-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button 
          v-if="isOwner"
          size="sm" 
          class="h-8 gap-2" 
          @click="emit('create')"
        >
          <Icon name="i-lucide-plus" class="h-4 w-4" />
          <span class="hidden sm:inline">ایجاد سرویس</span>
        </Button>
      </div>
    </div>
  </div>
</template>
