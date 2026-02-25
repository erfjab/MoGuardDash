<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import type { NodeResponse } from '~/types/api'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Icon } from '#components'
import DataTableFacetedFilter from './DataTableFacetedFilter.vue'
import DataTableOrderBy from './DataTableOrderBy.vue'
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
  table: Table<NodeResponse>
  totalCount: number
  categoryFilters: Set<string>
  orderBy?: string
  refreshIntervalOptions: RefreshOption[]
  selectedRefreshInterval: number
  refreshMenuLabel: string
}

defineProps<DataTableToolbarProps>()

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'refreshNow'): void
  (e: 'selectRefreshInterval', interval: number): void
  (e: 'updateCategoryFilters', values: string[]): void
  (e: 'updateOrderBy', value: string | undefined): void
}>()

const categoryOptions = [
  { label: 'Marzban', value: 'category:marzban', icon: 'i-radix-icons-cube' },
  { label: 'Marzneshin', value: 'category:marzneshin', icon: 'i-radix-icons-cube' },
  { label: 'Rustneshin', value: 'category:rustneshin', icon: 'i-radix-icons-cube' },
]

const orderOptions = [
  { label: 'نام (الف-ی)', value: 'remark_asc' },
  { label: 'نام (ی-الف)', value: 'remark_desc' },
  { label: 'ایجاد (جدیدترین)', value: 'created_at_desc' },
  { label: 'ایجاد (قدیمی‌ترین)', value: 'created_at_asc' },
  { label: 'به‌روزرسانی (جدیدترین)', value: 'updated_at_desc' },
  { label: 'به‌روزرسانی (قدیمی‌ترین)', value: 'updated_at_asc' },
  { label: 'مصرف (بیشترین)', value: 'current_usage_desc' },
  { label: 'مصرف (کمترین)', value: 'current_usage_asc' },
  { label: 'اولویت (بالاترین)', value: 'priority_desc' },
  { label: 'اولویت (پایین‌ترین)', value: 'priority_asc' },
]
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Mobile layout -->
    <div class="flex flex-col gap-3 sm:hidden">
      <!-- Row 1: Search full width with count badge -->
      <div class="relative">
        <Input
          placeholder="جستجو نودها..."
          :model-value="(table.getColumn('remark')?.getFilterValue() as string) ?? ''"
          class="h-9 w-full pl-16 text-right"
          dir="rtl"
          @input="table.getColumn('remark')?.setFilterValue($event.target.value)"
        />
        <Badge variant="secondary" class="absolute left-2 top-1/2 -translate-y-1/2">
          {{ totalCount }}
        </Badge>
      </div>

      <!-- Row 2: Sort (50%) + Category (50%) -->
      <div class="grid grid-cols-10 gap-2">
        <div class="col-span-5">
          <DataTableOrderBy
            title="مرتب‌سازی"
            :options="orderOptions"
            :selected-value="orderBy"
            :allow-clear="false"
            @update="emit('updateOrderBy', $event)"
          />
        </div>
        <div class="col-span-5">
          <DataTableFacetedFilter
            title="دسته‌بندی"
            :options="categoryOptions"
            :selected-values="categoryFilters"
            @update="emit('updateCategoryFilters', $event)"
          />
        </div>
      </div>

      <!-- Row 3: Create button and Refresh dropdown -->
      <div class="flex gap-2">
        <Button 
          size="sm" 
          class="h-9 flex-1 gap-2" 
          @click="emit('create')"
        >
          <Icon name="i-lucide-plus" class="h-4 w-4" />
          ایجاد نود
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button size="sm" variant="outline" class="h-9 gap-1 items-center">
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
            placeholder="جستجو نودها..."
            :model-value="(table.getColumn('remark')?.getFilterValue() as string) ?? ''"
            class="h-8 w-[150px] lg:w-[250px] pl-14 text-right"
            dir="rtl"
            @input="table.getColumn('remark')?.setFilterValue($event.target.value)"
          />
          <Badge variant="secondary" class="absolute left-2 top-1/2 -translate-y-1/2 text-xs">
            {{ totalCount }}
          </Badge>
        </div>

        <DataTableFacetedFilter
          title="دسته‌بندی"
          :options="categoryOptions"
          :selected-values="categoryFilters"
          @update="emit('updateCategoryFilters', $event)"
        />

        <DataTableOrderBy
          title="مرتب‌سازی"
          :options="orderOptions"
          :selected-value="orderBy"
          :allow-clear="false"
          @update="emit('updateOrderBy', $event)"
        />
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
        <Button size="sm" class="h-8 gap-2" @click="emit('create')">
          <Icon name="i-lucide-plus" class="h-4 w-4" />
          <span class="hidden sm:inline">ایجاد نود</span>
        </Button>
      </div>
    </div>
  </div>
</template>
