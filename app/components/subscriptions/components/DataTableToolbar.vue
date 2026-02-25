<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import type { SubscriptionResponse } from '~/types/api'
import { computed, ref, watch } from 'vue'
const { t } = useI18n()
import DataTableFacetedFilter from './DataTableFacetedFilter.vue'
import DataTableOrderBy from './DataTableOrderBy.vue'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Check, ChevronDown } from 'lucide-vue-next'
import { Icon } from '#components'

interface RefreshOption {
  label: string
  value: number
}

interface DataTableToolbarProps {
  table: Table<SubscriptionResponse>
  canCreate?: boolean
  statusFilters: Set<string>
  orderBy?: string
  searchQuery?: string
  totalCount: number
  refreshIntervalOptions: RefreshOption[]
  selectedRefreshInterval: number
  refreshMenuLabel: string
  selectedCount: number
  selectedUsernames: string[]
}

const props = defineProps<DataTableToolbarProps>()
const emit = defineEmits<{
  (e: 'create'): void
  (e: 'updateStatusFilters', values: string[]): void
  (e: 'updateOrderBy', value: string | undefined): void
  (e: 'updateSearch', value: string): void
  (e: 'refreshNow'): void
  (e: 'selectRefreshInterval', interval: number): void
  (e: 'bulkAction', payload: { action: string; usernames: string[] }): void
}>()

const localSearchInput = ref(props.searchQuery ?? '')
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function handleSearchInput(value: string) {
  localSearchInput.value = value
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    emit('updateSearch', value)
  }, 300)
}

watch(() => props.searchQuery, (newVal) => {
  if (newVal !== localSearchInput.value) {
    localSearchInput.value = newVal ?? ''
  }
})

const selectedCount = computed(() => props.selectedCount ?? 0)
const selectedUsernames = computed(() => props.selectedUsernames ?? [])
const isFiltered = computed(() => props.statusFilters.size > 0 || !!props.searchQuery)

const bulkActions = computed(() => [
  { label: t('subscriptions.resetUsage'), value: 'reset', icon: 'i-lucide-rotate-ccw' },
  { label: t('subscriptions.revokeAccess'), value: 'revoke', icon: 'i-lucide-lock' },
  { label: t('subscriptions.enable'), value: 'enable', icon: 'i-lucide-check-circle' },
  { label: t('subscriptions.disable'), value: 'disable', icon: 'i-lucide-ban' },
  { label: t('subscriptions.remove'), value: 'delete', icon: 'i-lucide-trash-2' },
])

function handleBulkActionSelection(action: string) {
  if (selectedUsernames.value.length === 0) return
  emit('bulkAction', { action, usernames: selectedUsernames.value })
}

const statusOptions = computed(() => [
  { label: t('subscriptions.statusActive'), value: 'is_active:true', icon: 'i-radix-icons-check-circled' },
  { label: t('subscriptions.statusInactive'), value: 'is_active:false', icon: 'i-radix-icons-cross-circled' },
  { label: t('subscriptions.statusEnabled'), value: 'enabled:true', icon: 'i-radix-icons-play' },
  { label: t('subscriptions.statusDisabled'), value: 'enabled:false', icon: 'i-radix-icons-pause' },
  { label: t('subscriptions.statusOnline'), value: 'online:true', icon: 'i-radix-icons-dot-filled' },
  { label: t('subscriptions.statusOffline'), value: 'online:false', icon: 'i-radix-icons-dot' },
  { label: t('subscriptions.statusLimited'), value: 'limited:true', icon: 'i-radix-icons-exclamation-triangle' },
  { label: t('subscriptions.statusNotLimited'), value: 'limited:false', icon: 'i-radix-icons-check' },
  { label: t('subscriptions.statusExpired'), value: 'expired:true', icon: 'i-radix-icons-clock' },
  { label: t('subscriptions.statusNotExpired'), value: 'expired:false', icon: 'i-radix-icons-timer' },
])

const orderOptions = computed(() => [
  { label: t('subscriptions.sortUsernameAsc'), value: 'username_asc' },
  { label: t('subscriptions.sortUsernameDesc'), value: 'username_desc' },
  { label: t('subscriptions.sortCreatedAsc'), value: 'created_at_asc' },
  { label: t('subscriptions.sortCreatedDesc'), value: 'created_at_desc' },
  { label: t('subscriptions.sortUpdatedAsc'), value: 'updated_at_asc' },
  { label: t('subscriptions.sortUpdatedDesc'), value: 'updated_at_desc' },
  { label: t('subscriptions.sortUsageAsc'), value: 'current_usage_asc' },
  { label: t('subscriptions.sortUsageDesc'), value: 'current_usage_desc' },
  { label: t('subscriptions.sortExpireDateAsc'), value: 'expire_date_asc' },
  { label: t('subscriptions.sortExpireDateDesc'), value: 'expire_date_desc' },
  { label: t('subscriptions.sortOnlineAtAsc'), value: 'online_at_asc' },
  { label: t('subscriptions.sortOnlineAtDesc'), value: 'online_at_desc' },
  { label: t('subscriptions.sortLastRequestAsc'), value: 'last_request_at_asc' },
  { label: t('subscriptions.sortLastRequestDesc'), value: 'last_request_at_desc' },
  { label: t('subscriptions.sortLastRevokeAsc'), value: 'last_revoke_at_asc' },
  { label: t('subscriptions.sortLastRevokeDesc'), value: 'last_revoke_at_desc' },
  { label: t('subscriptions.sortLastResetAsc'), value: 'last_reset_at_asc' },
  { label: t('subscriptions.sortLastResetDesc'), value: 'last_reset_at_desc' },
  { label: t('subscriptions.sortLeftUsageAsc'), value: 'left_usage_asc' },
  { label: t('subscriptions.sortLeftUsageDesc'), value: 'left_usage_desc' },
  { label: t('subscriptions.sortLimitUsageAsc'), value: 'limit_usage_asc' },
  { label: t('subscriptions.sortLimitUsageDesc'), value: 'limit_usage_desc' },
])

// Note: Reset button removed per request; filters can be adjusted via controls individually
</script>

<template>
  <div class="flex flex-col gap-2">
    <!-- Mobile layout -->
  <div class="flex flex-col gap-3 sm:hidden">
      <!-- Row 1: Username search full width with count badge -->
      <div class="relative">
        <Input
          :placeholder="$t('subscriptions.searchByUsername')"
          :model-value="localSearchInput"
          class="h-9 w-full ltr:pr-16 rtl:pl-16"
          @input="handleSearchInput($event.target.value)"
        />
        <Badge variant="secondary" class="absolute ltr:right-2 rtl:left-2 top-1/2 -translate-y-1/2">
          {{ totalCount }}
        </Badge>
      </div>

      <!-- Row 2: Sort (60%) + Status (40%) -->
      <div class="grid grid-cols-10 gap-2">
        <div class="col-span-6">
          <DataTableOrderBy
            :title="$t('subscriptions.sortBy')"
            :options="orderOptions"
            :selected-value="orderBy"
            :allow-clear="false"
            @update="emit('updateOrderBy', $event)"
          />
        </div>
        <div class="col-span-4">
          <DataTableFacetedFilter
            :title="$t('common.status')"
            :options="statusOptions"
            :selected-values="statusFilters"
            @update="emit('updateStatusFilters', $event)"
          />
        </div>
      </div>

      <!-- Reset button removed by request -->

      <!-- Row 3: Refresh + Bulk actions + Create -->
      <div class="flex w-full flex-wrap items-center justify-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button size="sm" variant="outline" class="h-9 gap-2 items-center flex-1 justify-center text-center">
              <Icon name="i-lucide-rotate-cw" class="h-4 w-4" />
              <span class="flex items-center gap-1">
                <span>{{ $t('common.refresh') }}</span>
                <span class="text-sm text-muted-foreground">({{ refreshMenuLabel }})</span>
              </span>
              <ChevronDown class="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-48">
            <DropdownMenuItem class="justify-between" @click="emit('refreshNow')">
              {{ $t('subscriptions.refreshNow') }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              v-for="option in refreshIntervalOptions"
              :key="option.value"
              class="flex items-center justify-between gap-2"
              @click="emit('selectRefreshInterval', option.value)"
            >
              {{ $t('subscriptions.every') }} {{ option.label }}
              <Check v-if="selectedRefreshInterval === option.value" class="h-4 w-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button size="sm" variant="secondary" class="h-9 gap-2 flex-1 justify-center text-center">
              <Icon name="i-lucide-sliders-horizontal" class="h-4 w-4" />
              <span>{{ $t('subscriptions.bulkActions') }} ({{ selectedCount }})</span>
              <ChevronDown class="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" class="w-56">
            <DropdownMenuLabel class="text-xs text-muted-foreground">
              {{ selectedCount }} {{ $t('subscriptions.selected') }}
            </DropdownMenuLabel>
            <DropdownMenuItem
              v-for="action in bulkActions"
              :key="action.value"
              class="flex items-center gap-2 text-sm"
              :disabled="selectedCount === 0"
              @click="handleBulkActionSelection(action.value)"
            >
              <Icon :name="action.icon" class="h-4 w-4" />
              <span>{{ action.label }}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          size="sm" 
          class="h-9 flex-1 gap-2" 
          :variant="canCreate === false ? 'secondary' : 'default'"
          :disabled="canCreate === false"
          @click="emit('create')"
        >
          <Icon name="i-radix-icons-plus" class="h-4 w-4" />
          {{ $t('subscriptions.newSubscription') }}
        </Button>
      </div>
    </div>

    <!-- Desktop/Tablet layout -->
    <div class="hidden sm:flex items-center justify-between gap-2">
      <div class="flex flex-1 items-center flex-wrap gap-2">
        <div class="relative">
          <Input
            :placeholder="$t('subscriptions.searchByUsername')"
            :model-value="localSearchInput"
            class="h-8 w-[150px] lg:w-[250px] ltr:pr-14 rtl:pl-14"
            @input="handleSearchInput($event.target.value)"
          />
          <Badge variant="secondary" class="absolute ltr:right-2 rtl:left-2 top-1/2 -translate-y-1/2 text-xs">
            {{ totalCount }}
          </Badge>
        </div>
        
        <DataTableFacetedFilter
          :title="$t('common.status')"
          :options="statusOptions"
          :selected-values="statusFilters"
          @update="emit('updateStatusFilters', $event)"
        />
        
        <DataTableOrderBy
          :title="$t('subscriptions.sortBy')"
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
                <span>{{ $t('common.refresh') }}</span>
                <span class="text-sm text-muted-foreground">({{ refreshMenuLabel }})</span>
              </span>
              <ChevronDown class="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-48">
            <DropdownMenuItem class="justify-between" @click="emit('refreshNow')">
              {{ $t('subscriptions.refreshNow') }}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              v-for="option in refreshIntervalOptions"
              :key="option.value"
              class="flex items-center justify-between gap-2"
              @click="emit('selectRefreshInterval', option.value)"
            >
              {{ $t('subscriptions.every') }} {{ option.label }}
              <Check v-if="selectedRefreshInterval === option.value" class="h-4 w-4" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button size="sm" variant="secondary" class="h-8 gap-2">
              <Icon name="i-lucide-sliders-horizontal" class="h-4 w-4" />
              <span>{{ $t('subscriptions.bulkActions') }} ({{ selectedCount }})</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-56">
            <DropdownMenuLabel class="text-xs text-muted-foreground">
              {{ selectedCount }} {{ $t('subscriptions.selected') }}
            </DropdownMenuLabel>
            <DropdownMenuItem
              v-for="action in bulkActions"
              :key="action.value"
              class="flex items-center gap-2 text-sm"
              :disabled="selectedCount === 0"
              @click="handleBulkActionSelection(action.value)"
            >
              <Icon :name="action.icon" class="h-4 w-4" />
              <span>{{ action.label }}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button 
          size="sm" 
          class="h-8 gap-2" 
          :variant="canCreate === false ? 'secondary' : 'default'"
          :disabled="canCreate === false"
          @click="emit('create')"
        >
          <Icon name="i-radix-icons-plus" class="h-4 w-4" />
          <span class="hidden sm:inline">{{ $t('subscriptions.newSubscription') }}</span>
        </Button>
      </div>
    </div>
  </div>
</template>
