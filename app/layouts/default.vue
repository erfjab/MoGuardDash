<script setup lang="ts">
</script>

<template>
  <SidebarProvider>
    <LayoutAppSidebar />
    <SidebarInset class="relative h-[100dvh] overflow-hidden flex flex-col">
      <LayoutHeader />
      <div class="min-w-0 w-full flex-1 overflow-auto p-4 lg:p-6">
        <slot />
      </div>
      <Toolbox />
    </SidebarInset>
  </SidebarProvider>
</template>

<style scoped>

</style>
