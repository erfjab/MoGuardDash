<script setup lang="ts">
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'

import type { NodeResponse } from '~/types/api'
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
import DataTableToolbar from './DataTableToolbar.vue'

interface RefreshOption {
  label: string
  value: number
}

interface DataTableProps {
  columns: ColumnDef<NodeResponse, any>[]
  data: NodeResponse[]
  loading?: boolean
  categoryFilters: Set<string>
  orderBy?: string
  refreshIntervalOptions: RefreshOption[]
  selectedRefreshInterval: number
  refreshMenuLabel: string
}
const props = defineProps<DataTableProps>()
const emit = defineEmits<{
  (e: 'rowClick', row: NodeResponse): void
  (e: 'create'): void
  (e: 'refresh'): void
  (e: 'refreshNow'): void
  (e: 'selectRefreshInterval', interval: number): void
  (e: 'updateCategoryFilters', values: string[]): void
  (e: 'updateOrderBy', value: string | undefined): void
}>()

const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref({})

const table = useVueTable({
  get data() { return props.data },
  get columns() { return props.columns },
  state: {
    get sorting() { return sorting.value },
    get columnFilters() { return columnFilters.value },
    get columnVisibility() { return columnVisibility.value },
    get rowSelection() { return rowSelection.value },
  },
  enableRowSelection: true,
  onSortingChange: updaterOrValue => valueUpdater(updaterOrValue, sorting),
  onColumnFiltersChange: updaterOrValue => valueUpdater(updaterOrValue, columnFilters),
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
  onRowSelectionChange: updaterOrValue => valueUpdater(updaterOrValue, rowSelection),
  getCoreRowModel: getCoreRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: getPaginationRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFacetedRowModel: getFacetedRowModel(),
  getFacetedUniqueValues: getFacetedUniqueValues(),
})
</script>

<template>
  <div class="space-y-4">
    <DataTableToolbar 
      :table="table"
      :total-count="data.length"
      :category-filters="categoryFilters"
      :order-by="orderBy"
      :refresh-interval-options="refreshIntervalOptions"
      :selected-refresh-interval="selectedRefreshInterval"
      :refresh-menu-label="refreshMenuLabel"
      @create="emit('create')" 
      @refresh="emit('refresh')"
      @refresh-now="emit('refreshNow')"
      @select-refresh-interval="(interval) => emit('selectRefreshInterval', interval)"
      @update-category-filters="emit('updateCategoryFilters', $event)"
      @update-order-by="emit('updateOrderBy', $event)"
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
              نودی یافت نشد.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
