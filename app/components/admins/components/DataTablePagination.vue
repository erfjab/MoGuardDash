<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'
import type { AdminResponse } from '~/types/api'
import { computed } from 'vue'

interface DataTablePaginationProps {
  table: Table<AdminResponse>
}
const props = defineProps<DataTablePaginationProps>()
const { t } = useI18n()
const emit = defineEmits<{
  (e: 'pageChange', page: number): void
}>()

function handlePageChange(pageIndex: number) {
  emit('pageChange', pageIndex + 1)
}

// Calculate visible page numbers
const visiblePages = computed(() => {
  const currentPage = props.table.getState().pagination.pageIndex + 1
  const totalPages = props.table.getPageCount()
  const pages: (number | string)[] = []
  
  if (totalPages <= 7) {
    // Show all pages if 7 or less
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i)
    }
  } else {
    // Always show first page
    pages.push(1)
    
    if (currentPage > 3) {
      pages.push('...')
    }
    
    // Show pages around current page
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    
    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('...')
    }
    
    // Always show last page
    pages.push(totalPages)
  }
  
  return pages
})
</script>

<template>
  <div class="flex items-center justify-center px-2 gap-2">
    <div class="flex items-center space-x-2">
      <!-- First page button -->
      <Button
        variant="outline"
        class="hidden h-8 w-8 p-0 lg:flex"
        :disabled="!table.getCanPreviousPage()"
        @click="handlePageChange(0)"
      >
        <span class="sr-only">{{ t('common.paginationFirst') }}</span>
        <Icon name="i-radix-icons-double-arrow-left" class="h-4 w-4" />
      </Button>
      
      <!-- Previous button -->
      <Button
        variant="outline"
        class="h-8 w-8 p-0"
        :disabled="!table.getCanPreviousPage()"
        @click="handlePageChange(table.getState().pagination.pageIndex - 1)"
      >
        <span class="sr-only">{{ t('common.paginationPrevious') }}</span>
        <Icon name="i-radix-icons-chevron-left" class="h-4 w-4" />
      </Button>
      
      <!-- Page numbers -->
      <div class="flex items-center gap-1">
        <template v-for="page in visiblePages" :key="page">
          <Button
            v-if="typeof page === 'number'"
            :variant="table.getState().pagination.pageIndex === page - 1 ? 'default' : 'outline'"
            class="h-8 w-8 p-0"
            @click="handlePageChange(page - 1)"
          >
            {{ page }}
          </Button>
          <span v-else class="px-2 text-muted-foreground">...</span>
        </template>
      </div>
      
      <!-- Next button -->
      <Button
        variant="outline"
        class="h-8 w-8 p-0"
        :disabled="!table.getCanNextPage()"
        @click="handlePageChange(table.getState().pagination.pageIndex + 1)"
      >
        <span class="sr-only">{{ t('common.paginationNext') }}</span>
        <Icon name="i-radix-icons-chevron-right" class="h-4 w-4" />
      </Button>
      
      <!-- Last page button -->
      <Button
        variant="outline"
        class="hidden sm:flex h-8 w-8 p-0"
        :disabled="!table.getCanNextPage()"
        @click="handlePageChange(table.getPageCount() - 1)"
      >
        <span class="sr-only">{{ t('common.paginationLast') }}</span>
        <Icon name="i-radix-icons-double-arrow-right" class="h-4 w-4" />
      </Button>
    </div>
  </div>
</template>
