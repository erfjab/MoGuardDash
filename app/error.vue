<script setup>
const { theme } = useAppSettings()

useHead({
  bodyAttrs: {
    class: computed(() => `color-${theme.value?.color || 'default'} theme-${theme.value?.type || 'default'}`),
  },
})

const router = useRouter()
</script>

<template>
  <div class="h-svh" dir="rtl">
    <div class="m-auto h-full w-full flex flex-col items-center justify-center gap-4 text-center">
      <h1 class="text-[7rem] font-bold leading-tight text-primary">
        404
      </h1>
      <span class="text-2xl font-bold">{{ $t('common.pageNotFound') }}</span>
      <p class="text-muted-foreground max-w-md px-4">
        {{ $t('common.pageNotFoundDesc') }}
      </p>
      <div class="mt-6 flex gap-4">
        <Button variant="outline" @click="router.back()">
          {{ $t('common.goBack') }}
        </Button>
        <Button @click="router.push('/')">
          {{ $t('common.backToHome') }}
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>

</style>
