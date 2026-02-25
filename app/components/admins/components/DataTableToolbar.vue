<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import type { AdminResponse } from '~/types/api'
import { watch } from 'vue'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
  table: Table<AdminResponse>
  totalCount: number
  searchTerm: string
  statusFilters: Set<string>
  roleFilters: Set<string>
  orderBy?: string
  refreshIntervalOptions: RefreshOption[]
  selectedRefreshInterval: number
  refreshMenuLabel: string
}

const props = defineProps<DataTableToolbarProps>()
const emit = defineEmits<{
  (e: 'create'): void
  (e: 'updateSearch', value: string): void
  (e: 'updateStatusFilters', values: string[]): void
  (e: 'updateRoleFilters', values: string[]): void
  (e: 'updateOrderBy', value: string | undefined): void
  (e: 'refreshNow'): void
  (e: 'selectRefreshInterval', interval: number): void
}>()


const { t } = useI18n()

const statusOptions = [
  { label: 'فعال', value: 'enabled:true', icon: 'i-radix-icons-play' },
  { label: 'غیرفعال', value: 'enabled:false', icon: 'i-radix-icons-pause' },
  { label: 'محدودیت تعداد', value: 'reached_count_limit:true', icon: 'i-radix-icons-bar-chart' },
  { label: 'محدودیت مصرف', value: 'reached_usage_limit:true', icon: 'i-radix-icons-activity-log' },
]

const roleOptions = computed(() => [
  { label: t('admins.owner'), value: 'role:owner', icon: 'i-radix-icons-crown' },
  { label: t('admins.seller'), value: 'role:seller', icon: 'i-radix-icons-user' },
  { label: t('admins.reseller'), value: 'role:reseller', icon: 'i-radix-icons-users' },
])

const orderOptions = [
  { label: 'نام کاربری (الف-ی)', value: 'username_asc' },
  { label: 'نام کاربری (ی-الف)', value: 'username_desc' },
  { label: 'ایجاد (جدیدترین)', value: 'created_at_desc' },
  { label: 'ایجاد (قدیمی‌ترین)', value: 'created_at_asc' },
  { label: 'به‌روزرسانی (جدیدترین)', value: 'updated_at_desc' },
  { label: 'به‌روزرسانی (قدیمی‌ترین)', value: 'updated_at_asc' },
  { label: 'مصرف (بیشترین)', value: 'current_usage_desc' },
  { label: 'مصرف (کمترین)', value: 'current_usage_asc' },
  { label: 'کاربران (بیشترین)', value: 'current_count_desc' },
  { label: 'کاربران (کمترین)', value: 'current_count_asc' },
]

watch(() => props.searchTerm, (value) => {
  props.table.getColumn('username')?.setFilterValue(value)
})

function handleSearch(value: string) {
  emit('updateSearch', value)
  props.table.getColumn('username')?.setFilterValue(value)
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Mobile layout -->
    <div class="flex flex-col gap-3 sm:hidden">
      <!-- Row 1: Search full width with count badge -->
      <div class="relative">
        <Input
          placeholder="جستجو ادمین‌ها..."
          :model-value="searchTerm"
          class="h-9 w-full pl-16 text-right"
          dir="rtl"
          @input="handleSearch($event.target.value)"
        />
        <Badge variant="secondary" class="absolute left-2 top-1/2 -translate-y-1/2">
          {{ totalCount }}
        </Badge>
      </div>

      <!-- Row 2: Sort (50%) + Role (50%) -->
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
            title="نقش"
            :options="roleOptions"
            :selected-values="roleFilters"
            @update="emit('updateRoleFilters', $event)"
          />
        </div>
      </div>

      <!-- Row 3: Status filter -->
      <DataTableFacetedFilter
        title="وضعیت"
        :options="statusOptions"
        :selected-values="statusFilters"
        @update="emit('updateStatusFilters', $event)"
      />

      <!-- Row 4: Create button and Refresh dropdown -->
      <div class="flex gap-2">
        <Button 
          size="sm" 
          class="h-9 flex-1 gap-2" 
          @click="emit('create')"
        >
          <Icon name="i-lucide-plus" class="h-4 w-4" />
          ایجاد ادمین
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
            placeholder="جستجو ادمین‌ها..."
            :model-value="searchTerm"
            class="h-8 w-[150px] lg:w-[250px] pl-14 text-right"
            dir="rtl"
            @input="handleSearch($event.target.value)"
          />
          <Badge variant="secondary" class="absolute left-2 top-1/2 -translate-y-1/2 text-xs">
            {{ totalCount }}
          </Badge>
        </div>

        <DataTableFacetedFilter
          title="نقش"
          :options="roleOptions"
          :selected-values="roleFilters"
          @update="emit('updateRoleFilters', $event)"
        />

        <DataTableFacetedFilter
          title="وضعیت"
          :options="statusOptions"
          :selected-values="statusFilters"
          @update="emit('updateStatusFilters', $event)"
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
          <span class="hidden sm:inline">ایجاد ادمین</span>
        </Button>
      </div>
    </div>
  </div>
</template>
