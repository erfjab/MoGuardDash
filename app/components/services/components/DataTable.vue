<script setup lang="ts">
import type { ColumnDef } from '@tanstack/vue-table'
import type { ServiceResponse } from '~/types/api'
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
import DataTableToolbar from './DataTableToolbar.vue'

interface RefreshOption {
  label: string
  value: number
}

interface DataTableProps {
  columns: ColumnDef<ServiceResponse, any>[]
  data: ServiceResponse[]
  totalCount: number
  isOwner?: boolean
  refreshIntervalOptions: RefreshOption[]
  selectedRefreshInterval: number
  refreshMenuLabel: string
}
const props = defineProps<DataTableProps>()
const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'create'): void
  (e: 'rowClick', row: ServiceResponse): void
  (e: 'refreshNow'): void
  (e: 'selectRefreshInterval', interval: number): void
}>()

const columnVisibility = ref({})

const table = useVueTable({
  get data() { return props.data },
  get columns() { return props.columns },
  state: {
    get columnVisibility() { return columnVisibility.value },
  },
  onColumnVisibilityChange: updaterOrValue => valueUpdater(updaterOrValue, columnVisibility),
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
      :is-owner="isOwner"
      :refresh-interval-options="refreshIntervalOptions"
      :selected-refresh-interval="selectedRefreshInterval"
      :refresh-menu-label="refreshMenuLabel"
      @refresh="emit('refresh')"
      @create="emit('create')"
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
          <template v-if="table.getRowModel().rows?.length">
            <TableRow
              v-for="row in table.getRowModel().rows"
              :key="row.id"
              class="hover:bg-muted/30 cursor-pointer"
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
              سرویسی یافت نشد.
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  </div>
</template>
