<script setup lang="ts">
const router = useRouter()
const { t } = useI18n()

function goToStats() {
  router.push('/')
}
</script>

<template>
  <div class="flex items-center gap-3 p-4 cursor-pointer hover:bg-accent/50 rounded-md transition-colors" @click="goToStats">
    <div class="flex items-center justify-center h-10 w-10 rounded-lg bg-black p-1.5">
      <img src="/Guard.png" alt="Guard Logo" class="h-full w-full object-contain scale-90">
    </div>
    <div class="flex flex-col">
      <h2 class="text-lg font-semibold leading-tight">{{ t('appInfo.title') }}</h2>
      <span class="text-[10px] text-muted-foreground">{{ t('appInfo.subtitle') }}</span>
    </div>
  </div>
</template>

<style scoped>

</style>
