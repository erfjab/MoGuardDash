<script setup lang="ts">
const router = useRouter()
const { t } = useI18n()

function goToStats() {
  router.push('/')
}
</script>

<template>
  <div class="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/50 rounded-md transition-colors" @click="goToStats">
    <div class="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary">
      <Icon name="i-lucide-layout-dashboard" class="h-5 w-5" />
    </div>
    <div class="flex flex-col">
      <h2 class="text-lg font-semibold leading-tight">{{ t('appInfo.title') }}</h2>
      <span class="text-[10px] text-muted-foreground">{{ t('appInfo.subtitle') }}</span>
    </div>
  </div>
</template>

<style scoped>

</style>
