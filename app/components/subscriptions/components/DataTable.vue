<script setup lang="ts">
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'

import type { SubscriptionResponse } from '~/types/api'
import {
  FlexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { valueUpdater } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import DataTablePagination from './DataTablePagination.vue'
import DataTableToolbar from './DataTableToolbar.vue'
import { ref, watch, computed } from 'vue'

interface RefreshOption {
  label: string
  value: number
}

interface DataTableProps {
  columns: ColumnDef<SubscriptionResponse, any>[]
  data: SubscriptionResponse[]
  canCreate?: boolean
  statusFilters: Set<string>
  orderBy?: string
  searchQuery?: string
  totalCount: number
  currentPage: number
  pageSize: number
  loading?: boolean
  refreshIntervalOptions: RefreshOption[]
  selectedRefreshInterval: number
  refreshMenuLabel: string
  selectionResetKey?: number
}
const props = defineProps<DataTableProps>()
const emit = defineEmits<{
  (e: 'rowClick', row: SubscriptionResponse): void
  (e: 'create'): void
  (e: 'refresh'): void
  (e: 'updateStatusFilters', values: string[]): void
  (e: 'updateOrderBy', value: string | undefined): void
  (e: 'updateSearch', value: string): void
  (e: 'pageChange', page: number): void
  (e: 'refreshNow'): void
  (e: 'selectRefreshInterval', interval: number): void
  (e: 'bulkAction', payload: { action: string; usernames: string[] }): void
}>()

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})

// Manual selection state - using Record for reactivity
const selectedIds = ref<Record<string, boolean>>({})

const table = useVueTable({
  get data() { return props.data },
  get columns() { return props.columns },
  get pageCount() { return Math.ceil(props.totalCount / props.pageSize) },
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
    get pagination() {
      return {
        pageIndex: props.currentPage - 1,
        pageSize: props.pageSize,
      }
    },
  },
  manualPagination: true,
  getRowId: (row) => String(row.id),
  onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: updaterOrValue => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
})

// Computed properties for selection state
const selectedCount = computed(() => Object.keys(selectedIds.value).filter(id => selectedIds.value[id]).length)
const selectedUsernames = computed(() => {
  const selectedIdKeys = Object.keys(selectedIds.value).filter(id => selectedIds.value[id])
  return props.data
    .filter(row => selectedIdKeys.includes(String(row.id)))
    .map(row => row.username)
})

const isAllSelected = computed(() => {
  return props.data.length > 0 && props.data.every(row => selectedIds.value[String(row.id)])
})

const isSomeSelected = computed(() => {
  const count = Object.keys(selectedIds.value).filter(id => selectedIds.value[id]).length
  return count > 0 && count < props.data.length
})

const headerCheckboxValue = computed(() => {
  if (isAllSelected.value) return true
  if (isSomeSelected.value) return 'indeterminate'
  return false
})

function toggleSelectAll(value: boolean | 'indeterminate') {
  if (value) {
    const next: Record<string, boolean> = {}
    props.data.forEach(row => {
      next[String(row.id)] = true
    })
    selectedIds.value = next
    return
  }

  selectedIds.value = {}
}

function toggleRowSelection(id: string, value: boolean) {
  if (value) {
    selectedIds.value[id] = true
  } else {
    delete selectedIds.value[id]
  }
  selectedIds.value = { ...selectedIds.value }
}

watch(() => props.selectionResetKey, () => {
  selectedIds.value = {}
})

watch(() => props.data, () => {
  // Optional: Clear selection on data change or keep it?
  // Usually better to clear if page changes, but if just refresh, maybe keep?
  // For now, let's keep it simple and not auto-clear unless requested
  // But if IDs are no longer present, we should probably clean them up?
  // Let's leave it manual for now as per "completely different method" request
})

function handleRefreshNow() {
  selectedIds.value = {}
  emit('refreshNow')
}
</script>

<template>
  <div class="space-y-4">
    <DataTableToolbar 
      :table="table"
      :selected-count="selectedCount"
      :selected-usernames="selectedUsernames"
      :can-create="canCreate" 
      :status-filters="statusFilters"
      :order-by="orderBy"
      :search-query="searchQuery"
      :total-count="totalCount"
      :refresh-interval-options="refreshIntervalOptions"
      :selected-refresh-interval="selectedRefreshInterval"
      :refresh-menu-label="refreshMenuLabel"
      @create="emit('create')" 
      @refresh="emit('refresh')"
      @update-status-filters="emit('updateStatusFilters', $event)"
      @update-order-by="emit('updateOrderBy', $event)"
      @update-search="emit('updateSearch', $event)"
      @refresh-now="handleRefreshNow"
      @select-refresh-interval="(interval) => emit('selectRefreshInterval', interval)"
      @bulk-action="emit('bulkAction', $event)"
    />
    <div class="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <!-- Manual Selection Header -->
            <TableHead class="w-[80px] rtl:!pr-8 rtl:!pl-2 ltr:!pl-6 ltr:!pr-2">
              <div class="flex items-center justify-start">
                <Checkbox 
                  :model-value="headerCheckboxValue"
                  @update:model-value="toggleSelectAll"
                  aria-label="Select all"
                />
              </div>
            </TableHead>
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :class="[
                'px-2 text-center',
                header.column.id === 'username' ? 'px-0 rtl:text-right ltr:text-left' : ''
              ]"
            >
              <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="loading">
            <TableRow v-for="i in 15" :key="i">
              <TableCell class="w-[80px] rtl:!pr-8 rtl:!pl-2 ltr:!pl-6 ltr:!pr-2">
                <Skeleton class="h-4 w-4" />
              </TableCell>
              <TableCell v-for="col in columns.length" :key="col">
                <Skeleton class="h-6 w-full" />
              </TableCell>
            </TableRow>
          </template>
          <template v-else-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              :data-state="selectedIds[row.id] ? 'selected' : undefined"
              class="cursor-pointer hover:bg-muted/50 data-[state=selected]:bg-muted"
              @click="emit('rowClick', row.original)"
            >
              <!-- Manual Selection Cell -->
              <TableCell class="w-[80px] rtl:!pr-8 rtl:!pl-2 ltr:!pl-6 ltr:!pr-2" @click.stop>
                <div class="flex items-center justify-start">
                  <Checkbox 
                    :model-value="selectedIds[row.id] ?? false"
                    @update:model-value="(val) => toggleRowSelection(row.id, val === true)"
                    aria-label="Select row"
                  />
                </div>
              </TableCell>
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                :class="[
                  'px-2 text-center',
                  cell.column.id === 'username' ? 'px-0 rtl:text-right ltr:text-left' : ''
                ]"
              >
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>

          <TableRow v-else>
            <TableCell
              :colspan="columns.length + 1"
              class="h-24 text-center"
            >
              {{ $t('subscriptions.noSubscriptionsFound') }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>

    <DataTablePagination 
      :table="table"
      @page-change="emit('pageChange', $event)"
    />
  </div>
</template>
