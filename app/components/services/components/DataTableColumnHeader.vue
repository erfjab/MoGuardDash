<script setup lang="ts">
import type { Column } from '@tanstack/vue-table'

interface Props {
  column: Column<any>
  title: string
}

defineProps<Props>()
</script>

<template>
  <div class="flex items-center">
    {{ title }}
  </div>
</template>
