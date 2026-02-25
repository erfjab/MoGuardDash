<script setup lang="ts">
const announcements = [
  'داشبورد به‌طور کامل به زبان فارسی ترجمه شد. در صورت مشاهده هرگونه مشکل، لطفاً با مدیریت تماس بگیرید.',
]

const showBar = ref(true)

// Combine all announcements with separator
const tickerText = computed(() => announcements.join('       •       '))
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="opacity-0 -translate-y-full"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 -translate-y-full"
  >
    <div
      v-if="showBar"
      class="w-full bg-muted/30 backdrop-blur-sm border-b overflow-hidden"
      dir="rtl"
    >
      <div class="relative py-2.5">
        <div class="flex items-center gap-3 px-4">
          <div class="flex-shrink-0 flex items-center justify-center">
            <div class="relative">
              <div class="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div class="relative w-1.5 h-1.5 rounded-full bg-primary" />
            </div>
          </div>
          <div class="flex-1 overflow-hidden">
            <div class="ticker-wrapper">
              <div class="ticker-content">
                <span v-for="i in 4" :key="i" class="ticker-item text-xs font-medium text-foreground/90 whitespace-nowrap">
                  {{ tickerText }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.ticker-wrapper {
  overflow: hidden;
  position: relative;
}

.ticker-content {
  display: flex;
  gap: 0;
  animation: scroll-ltr 10s linear infinite;
}

.ticker-item {
  flex-shrink: 0;
  padding-right: 5rem;
}

@keyframes scroll-ltr {
  0% {
    transform: translateX(-25%);
  }
  100% {
    transform: translateX(0);
  }
}
</style>
