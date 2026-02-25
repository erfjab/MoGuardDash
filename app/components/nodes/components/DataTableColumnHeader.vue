<script setup lang="ts">
export interface DataTableColumnHeaderProps {
  column: any
  title: string
}

defineProps<DataTableColumnHeaderProps>()
</script>

<template>
  <div class="flex items-center space-x-2">
    <span>{{ title }}</span>
  </div>
</template>
