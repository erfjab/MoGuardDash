<script setup lang="ts">
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'

import type { AdminResponse } from '~/types/api'
import {
  FlexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { valueUpdater } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import DataTableToolbar from './DataTableToolbar.vue'
import DataTablePagination from './DataTablePagination.vue'

interface RefreshOption {
  label: string
  value: number
}

interface DataTableProps {
  columns: ColumnDef<AdminResponse, any>[]
  data: AdminResponse[]
  totalCount: number
  currentPage: number
  pageSize: number
  searchTerm: string
  statusFilters: Set<string>
  roleFilters: Set<string>
  orderBy?: string
  loading?: boolean
  refreshIntervalOptions: RefreshOption[]
  selectedRefreshInterval: number
  refreshMenuLabel: string
}
const props = defineProps<DataTableProps>()
const emit = defineEmits<{
  (e: 'rowClick', row: AdminResponse): void
  (e: 'create'): void
  (e: 'refresh'): void
  (e: 'pageChange', page: number): void
  (e: 'updateSearch', value: string): void
  (e: 'updateStatusFilters', values: string[]): void
  (e: 'updateRoleFilters', values: string[]): void
  (e: 'updateOrderBy', value: string | undefined): void
  (e: 'refreshNow'): void
  (e: 'selectRefreshInterval', interval: number): void
}>()

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})

const table = useVueTable({
  get data() { return props.data },
  get columns() { return props.columns },
  get pageCount() { return Math.ceil(props.totalCount / props.pageSize) },
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
    get rowSelection() { return rowSelection.value },
    get pagination() {
      return {
        pageIndex: props.currentPage - 1,
        pageSize: props.pageSize,
      }
    },
  },
  manualPagination: true,
  enableRowSelection: true,
  onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: updaterOrValue => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: updaterOrValue => valueUpdater(updaterOrValue, rowSelection),
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
})
</script>

<template>
  <div class="space-y-4">
    <DataTableToolbar 
      :table="table"
      :total-count="totalCount"
      :search-term="searchTerm"
      :status-filters="statusFilters"
      :role-filters="roleFilters"
      :order-by="orderBy"
      :refresh-interval-options="refreshIntervalOptions"
      :selected-refresh-interval="selectedRefreshInterval"
      :refresh-menu-label="refreshMenuLabel"
      @create="emit('create')" 
      @refresh="emit('refresh')"
      @update-search="emit('updateSearch', $event)"
      @update-status-filters="emit('updateStatusFilters', $event)"
      @update-role-filters="emit('updateRoleFilters', $event)"
      @update-order-by="emit('updateOrderBy', $event)"
      @refresh-now="emit('refreshNow')"
      @select-refresh-interval="(interval) => emit('selectRefreshInterval', interval)"
    />
    <div class="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
            <TableHead v-for="header in headerGroup.headers" :key="header.id">
              <FlexRender v-if="!header.isPlaceholder" :render="header.column.columnDef.header" :props="header.getContext()" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="loading">
            <TableRow v-for="i in 15" :key="i">
              <TableCell v-for="col in columns.length" :key="col">
                <Skeleton class="h-6 w-full" />
              </TableCell>
            </TableRow>
          </template>
          <template v-else-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="cursor-pointer hover:bg-muted/50"
              @click="emit('rowClick', row.original)"
            >
              <TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
                <FlexRender :render="cell.column.columnDef.cell" :props="cell.getContext()" />
              </TableCell>
            </TableRow>
          </template>

          <TableRow v-else>
            <TableCell
              :colspan="columns.length"
              class="h-24 text-center"
            >
              ادمینی یافت نشد.
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
