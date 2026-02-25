<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner'
import { Toaster as Sonner } from 'vue-sonner'

const props = defineProps<ToasterProps>()
</script>

<template>
  <Sonner
    class="toaster group"
    v-bind="props"
    dir="rtl"
    :duration="3000"
    :toast-options="{
      unstyled: false,
      duration: 3000,
      classes: {
        toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
        description: 'group-[.toast]:text-muted-foreground',
        actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
        cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
        error: 'group-[.toaster]:bg-destructive group-[.toaster]:text-destructive-foreground group-[.toaster]:border-destructive',
        success: 'group-[.toaster]:bg-primary group-[.toaster]:text-primary-foreground group-[.toaster]:border-primary',
        info: 'group-[.toaster]:bg-accent group-[.toaster]:text-accent-foreground group-[.toaster]:border-accent',
      },
    }"
  />
</template>
